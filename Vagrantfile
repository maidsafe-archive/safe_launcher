# -*- mode: ruby -*-
# vi: set ft=ruby :

# A simple vagrant file, using debian/jessie64
# and latest install rust nightly + toolchain

MESSAGE = <<-MESSAGE
WELCOME to

    _____         ______ ______
   / ____|  /\   |  ____|  ____|
  | (___   /  \  | |__  | |__
   \___ \ / /\ \ |  __| |  __|
   ____) / ____ \| |    | |____
  |_____/_/    \_\_|    |______|


You can now log into your development enviroment via

    vagrant ssh

And in there do `cd /vagrant; npm start` to run the safe launcher.

Have fun!

MESSAGE

# The list of packages we need to have installed globally
INSTALL = <<-INSTALL
sudo apt-get update
sudo apt-get upgrade -y
sudo curl -sL https://deb.nodesource.com/setup_5.x | bash -
sudo apt-get install -y build-essential g++ pkg-config pgp python perl make curl git libsodium13 libsodium-dev nodejs clang libdbus-1-dev libgtk2.0-dev libnotify-dev libgnome-keyring-dev libgconf2-dev libasound2-dev libcap-dev libcups2-dev libxtst-dev libxss1 libnss3-dev gcc-multilib g++-multilib
sudo npm install -g node-gyp
INSTALL

SETUP_SAFE_FFI = <<-SAFE_FFI
cd /home/vagrant/
if [ -d "safe_ffi" ]; then
  cd safe_ffi
  git pull
else
  git clone https://github.com/maidsafe/safe_ffi.git safe_ffi
  cd safe_ffi
fi

cargo build --features "use-mock-routing"
cp -f target/debug/libsafe_ffi.so /vagrant/app/api/ffi/

# node-gyp fails to install some stuff if we NFS it
sudo -u vagrant mkdir -p /home/vagrant/node_modules
sudo -u vagrant mkdir -p /home/vagrant/app-node_modules
# sudo -u vagrant mkdir -p /home/vagrant/app-bower_components

sudo -u vagrant mkdir -p /vagrant/node_modules
sudo -u vagrant mkdir -p /vagrant/app/node_modules

sudo mount --bind /home/vagrant/node_modules /vagrant/node_modules
sudo mount --bind /home/vagrant/app-node_modules /vagrant/app/node_modules
# sudo mount --bind /home/vagrant/app-bower_components /vagrant/app/bower_components

cd /vagrant
sudo -u vagrant npm install
SAFE_FFI


Vagrant.configure(2) do |config|
  config.vm.box = "debian/jessie64"
  config.vm.post_up_message = MESSAGE

  config.vm.network "private_network", ip: "10.1.1.10"
  config.vm.synced_folder ".", "/vagrant",  type: 'nfs', mount_options: ['rw', 'vers=3', 'tcp', 'fsc' ,'actimeo=1']

  # keep the .gifconfig around the might have globally
  config.vm.provision "file", source: "~/.gitconfig", destination: "~/.gitconfig"

  # forward x11 so we can run the launcher and see it
  config.ssh.forward_x11 = true

  config.vm.provision "shell", inline: INSTALL

  # use rustup.sh to install rust stable.
  config.vm.provision "shell", inline: "curl -sO https://static.rust-lang.org/rustup.sh && sh rustup.sh --yes --channel=stable"


  config.vm.provision "shell", inline: SETUP_SAFE_FFI, run: "always"
  config.vm.provider "virtualbox" do |v|

    host = RbConfig::CONFIG['host_os']


    if host =~ /darwin/
      # sysctl returns Bytes and we need to convert to MB
      mem = `sysctl -n hw.memsize`.to_i / 1024
    elsif host =~ /linux/
      # meminfo shows KB and we need to convert to MB
      mem = `grep 'MemTotal' /proc/meminfo | sed -e 's/MemTotal://' -e 's/ kB//'`.to_i
    elsif host =~ /mswin|mingw|cygwin/
      # Windows code via https://github.com/rdsubhas/vagrant-faster
      mem = `wmic computersystem Get TotalPhysicalMemory`.split[1].to_i / 1024
    end

    # Give VM 1/4 system memory
    # as discussed here: https://stefanwrobel.com/how-to-make-vagrant-performance-not-suck
    v.memory = mem / 1024 / 4
  end
end
