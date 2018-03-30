import { Promise } from 'es6-promise';

export class FakeRef {

  constructor(public value: Object, public path: String = '', public parent?: FakeRef) {}

  child(name: string): FakeRef {
    let child = this.value[name] || {};
    return new FakeRef(child, `${this.path}/${name}`, this);
  }

  once(index: String): Promise<Object> {
    return Promise.resolve(this.value)
  }

  set(value: Object): Object {
    this.value = value;
    return this;
  }

  push(value: Object): Object {
    let i = 0;
    while (this.value.hasOwnProperty(`${i}`)) {
      i++
    }
    this.value[`${i}`] = value;
    return this.child(`${i}`);
  }

}

export class Snapshot {
  constructor(private delegate: Object) {}

  val(): Object {
    return this.delegate;
  }
}