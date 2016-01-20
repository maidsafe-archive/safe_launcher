// Copyright 2015 MaidSafe.net limited.
//
// This SAFE Network Software is licensed to you under (1) the MaidSafe.net Commercial License,
// version 1.0 or later, or (2) The General Public License (GPL), version 3, depending on which
// licence you accepted on initial access to the Software (the "Licences").
//
// By contributing code to the SAFE Network Software, or to this project generally, you agree to be
// bound by the terms of the MaidSafe Contributor Agreement, version 1.0.  This, along with the
// Licenses can be found in the root directory of this project at LICENSE, COPYING and CONTRIBUTOR.
//
// Unless required by applicable law or agreed to in writing, the SAFE Network Software distributed
// under the GPL Licence is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.
//
// Please review the Licences for the specific language governing permissions and limitations
// relating to use of the SAFE Network Software.

use std::net::TcpStream;
use std::sync::mpsc;

use bufstream::BufStream;

use maidsafe_utilities::thread::RaiiThreadJoiner;
use errors::LauncherError;

const STREAM_WRITER_THREAD_NAME: &'static str = "IpcStreamWriterThread";

pub struct IpcStream {
    _raii_joiner: RaiiThreadJoiner,
    write_sender: mpsc::Sender<WriterEvent>,
    reader_stream: BufStream<::std::net::TcpStream>,
}

impl IpcStream {
    pub fn new(stream: TcpStream) -> Result<IpcStream, LauncherError> {
        let cloned_stream = try!(stream.try_clone()
                                       .map_err(|e| LauncherError::IpcStreamCloneError(e)));
        let (tx, rx) = mpsc::channel();

        let joiner = thread!(STREAM_WRITER_THREAD_NAME, move || {
            IpcStream::handle_write(rx, cloned_stream);
            debug!("Exiting thread {:?}", STREAM_WRITER_THREAD_NAME);
        });

        Ok(IpcStream {
            _raii_joiner: RaiiThreadJoiner::new(joiner),
            write_sender: tx,
            reader_stream: BufStream::new(stream),
        })
    }

    // (Spandan)
    // There is a small block of unsafe code here to obtain raw uninitialised buffer. Justification
    // is in order. This code would only lead to undefined behaviour if the size of buffer exceeded
    // the allocated capacity which here it is clearly not. Also only if the Vector was constructed
    // of non-pod types (types with or composing types with a destructor having side effects) would
    // the behaviour be undefined as destructors would run on uninitialised memory. Again this is
    // not the case here as it is a Vector of u8's which is a built-in type and has bit-wise Copy
    // semantics. The gain however is substantial as we need a pre-allocated memory (which
    // with_capacity ensures) that will only be written to with raw bytes obtained from the stream.
    // Initialising it is an utter waste of cycles and will slow down networking without any
    // benefits if data exchanged are of considerable magnitude and frequency.
    #[allow(unsafe_code)]
    pub fn read_payload(&mut self) -> Result<Vec<u8>, LauncherError> {
        use byteorder::ReadBytesExt;

        let mut size_buffer = [0; 8];
        try!(self.fill_buffer(&mut size_buffer[..]));

        let size = try!(::std::io::Cursor::new(&size_buffer[..])
                            .read_u64::<::byteorder::LittleEndian>()
                            .map_err(|err| {
                                debug!("{:?}", err);
                                LauncherError::FailedReadingStreamPayloadSize
                            }));

        if size > ::config::MAX_ALLOWED_READ_PAYLOAD_SIZE_BYTES {
            return Err(LauncherError::ReadPayloadSizeProhibitive);
        }

        let mut payload = Vec::with_capacity(size as usize);
        unsafe {
            payload.set_len(size as usize);
        }

        try!(self.fill_buffer(&mut payload));

        Ok(payload)
    }

    pub fn write(&mut self, payload: Vec<u8>) -> Result<(), LauncherError> {
        Ok(try!(self.write_sender
                    .send(WriterEvent::WritePayload(payload))
                    .map_err(|err| {
                        debug!("Error {:?} sending event {:?}", err, err.0);
                        LauncherError::IpcSessionTerminated(None)
                    })))
    }

    // This will exit on any error condition the stream writer encounters. The stream reads can
    // continue. The next write event will however immediately notify the caller about the
    // writer channel being hung-up so that IPC Session can be terminated gracefully.
    fn handle_write(rx: mpsc::Receiver<WriterEvent>, mut stream: TcpStream) {
        use std::io::Write;
        use byteorder::WriteBytesExt;

        for it in rx.iter() {
            match it {
                WriterEvent::WritePayload(payload) => {
                    let size = payload.len() as u64;
                    let mut little_endian_size_bytes = Vec::with_capacity(8);
                    eval_break!(
                        little_endian_size_bytes.write_u64::<::byteorder::LittleEndian>(size)
                            .map_err(|err| {
                                debug!("{:?}", err);
                                LauncherError::FailedWritingStreamPayloadSize
                            }));

                    eval_break!(stream.write_all(&little_endian_size_bytes));
                    eval_break!(stream.write_all(&payload));
                }
                WriterEvent::Terminate => break,
            }
        }
    }

    fn fill_buffer(&mut self, mut buffer_view: &mut [u8]) -> Result<(), LauncherError> {
        use std::io::Read;

        while buffer_view.len() != 0 {
            match self.reader_stream.read(&mut buffer_view) {
                Ok(rxd_bytes) => {
                    if rxd_bytes == 0 {
                        return Err(LauncherError::IpcSessionTerminated(None));
                    }

                    let temp_buffer_view = buffer_view;
                    buffer_view = &mut temp_buffer_view[rxd_bytes..];
                }
                Err(ref err) if err.kind() == ::std::io::ErrorKind::Interrupted => (),
                Err(err) => return Err(LauncherError::IpcSessionTerminated(Some(err))),
            }
        }

        Ok(())
    }
}

impl Drop for IpcStream {
    fn drop(&mut self) {
        if let Err(err) = self.write_sender.send(WriterEvent::Terminate) {
            debug!("Could not send {:?} to stream writer {:?}", err.0, err);
        }
    }
}

#[derive(Debug)]
enum WriterEvent {
    WritePayload(Vec<u8>),
    Terminate,
}
