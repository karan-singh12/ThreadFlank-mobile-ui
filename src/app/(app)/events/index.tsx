import { Redirect } from "expo-router";

/** Events live in a tab of the Saved screen (as on the web); /events links land there. */
export default function EventsIndex() {
  return <Redirect href={{ pathname: "/saved", params: { tab: "events" } }} />;
}
