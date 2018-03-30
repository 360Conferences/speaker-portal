"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var functions = require("firebase-functions");
var sinon = require("sinon");
var sample_data_1 = require("./sample-data");
describe('Cloud Functions', function () {
    var configStub, index;
    before(function () {
        configStub = sinon.stub(functions, 'config').returns({
            firebase: {
                databaseURL: 'https://not-a-project.firebaseio.com',
                storageBucket: 'not-a-project.appspot.com'
            }
        });
        index = require('../src/index');
    });
    after(function () {
        configStub.restore();
    });
    it('should copy profile to speakers', function () {
        var sessionData = sample_data_1.sampleData.schedule.schedule1;
        var fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, null, sessionData)
        };
        var ref = new fake_ref_1.FakeRef(sample_data_1.sampleData);
        Object.defineProperty(fakeEvent.data, 'ref', { get: function () { return ref.child('schedule'); } });
        return index.scheduleUpdated(fakeEvent)
            .then(function (result) {
            var it = result[0];
            chai_1.expect(it.path).to.equal('/speakers/profile1');
            chai_1.expect(it.value).to.equal(sample_data_1.sampleData.profiles.profile1);
        });
    });
    it('should copy session info to sessions_by_date', function () {
        var sessionData = sample_data_1.sampleData.schedule.schedule1;
        var fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, null, sessionData)
        };
        var ref = new fake_ref_1.FakeRef(sample_data_1.sampleData);
        Object.defineProperty(fakeEvent.data, 'ref', { get: function () { return ref.child('schedule'); } });
        return index.scheduleUpdated(fakeEvent)
            .then(function (result) {
            var it = result[1];
            chai_1.expect(it.path).to.equal("/sessions_by_date/2018-04-12/0");
            chai_1.expect(it.value).to.equal(sample_data_1.sampleData.submissions.submission1);
        });
    });
    it('should copy session info to sessions', function () {
        var sessionData = sample_data_1.sampleData.schedule.schedule1;
        var fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, null, sessionData)
        };
        var ref = new fake_ref_1.FakeRef(sample_data_1.sampleData);
        Object.defineProperty(fakeEvent.data, 'ref', { get: function () { return ref.child('schedule'); } });
        return index.scheduleUpdated(fakeEvent)
            .then(function (result) {
            var it = result[2];
            chai_1.expect(it.path).to.equal("/sessions/submission1");
            chai_1.expect(it.value).to.equal(sample_data_1.sampleData.submissions.submission1);
        });
    });
});
