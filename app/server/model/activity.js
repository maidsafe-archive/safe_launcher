export let ActivityStatus = {
  IN_PROGRESS: 0,
  SUCCESS: 1,
  FAILURE: -1
};
export class Activity {
  constructor(id, name, startTime, endTime, status) {
    this.activityId = id;
    this.activityName = name;
    this.beginTime = startTime || Date.now();
    this.endTime = endTime;
    this.activityStatus = status || ActivityStatus.IN_PROGRESS;
  }

  get id() {
    return this.activityId;
  }

  get name() {
    return this.activityName;
  }

  get startTime() {
    return this.beginTime;
  }
}
