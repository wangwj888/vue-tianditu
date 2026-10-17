import { Emitter } from "mitt";

export type MapEmitEvents = {
  mapInit: T.Map;
  mapError: Error;
  mapDisposed: undefined;
  /** A child component failed after the map was ready (e.g. plugin loading). */
  componentError: Error;
};

export type MapEmitter = Emitter<MapEmitEvents>;
