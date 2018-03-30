import 'mocha';
import * as functions from 'firebase-functions';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { sampleData } from './sample-data';
import { FakeRef } from "./fake-ref";

describe('Cloud Functions', () => {

  let configStub, index;

  before(() => {
    configStub = sinon.stub(functions, 'config').returns({
      firebase: {
        databaseURL: 'https://not-a-project.firebaseio.com',
        storageBucket: 'not-a-project.appspot.com'
      }
    });

    index = require('../src/index');
  });

  after(() => {
    configStub.restore();
  });

  it('should copy profile to speakers', () => {
    const sessionData = sampleData.schedule.schedule1;
    const fakeEvent = {
      data: new functions.database.DeltaSnapshot(null, null, null, sessionData)
    };

    const ref = new FakeRef(sampleData);
    Object.defineProperty(fakeEvent.data, 'ref', { get: () => ref.child('schedule') });

    return index.scheduleUpdated(fakeEvent)
        .then(result => {
          const it = result[0];
          expect(it.path).to.equal('/speakers/profile1');
          expect(it.value).to.equal(sampleData.profiles.profile1);
        });
  });

  it('should copy session info to sessions_by_date', () => {
    const sessionData = sampleData.schedule.schedule1;
    const fakeEvent = {
      data: new functions.database.DeltaSnapshot(null, null, null, sessionData)
    };

    const ref = new FakeRef(sampleData);
    Object.defineProperty(fakeEvent.data, 'ref', { get: () => ref.child('schedule') });

    return index.scheduleUpdated(fakeEvent)
        .then(result => {
          const it = result[1];
          expect(it.path).to.equal("/sessions_by_date/2018-04-12/0");
          expect(it.value).to.equal(sampleData.submissions.submission1);
        });
  });

  it('should copy session info to sessions', () => {
    const sessionData = sampleData.schedule.schedule1;
    const fakeEvent = {
      data: new functions.database.DeltaSnapshot(null, null, null, sessionData)
    };

    const ref = new FakeRef(sampleData);
    Object.defineProperty(fakeEvent.data, 'ref', { get: () => ref.child('schedule') });

    return index.scheduleUpdated(fakeEvent)
        .then(result => {
          const it = result[2];
          expect(it.path).to.equal("/sessions/submission1");
          expect(it.value).to.equal(sampleData.submissions.submission1);
        });
  });
});

