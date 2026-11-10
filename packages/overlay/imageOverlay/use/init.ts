import { toBounds } from "../../../utils";
import { Props } from "./";

export function useInit(props: Props) {
  if (props.bounds?.length !== 2) {
    throw new Error("TdtImageOverlay requires bounds in the form [[lng, lat], [lng, lat]].");
  }
  return new T.ImageOverlay(props.url, toBounds(props.bounds), {
    opacity: props.opacity,
    alt: props.alt
  });
}
