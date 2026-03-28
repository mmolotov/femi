import { Panel } from "../components/Panel";

export function SettingsRoute() {
  return (
    <>
      <Panel
        description="This page anchors the non-medical and privacy posture from the start."
        title="Settings"
      >
        <dl className="details-list">
          <div>
            <dt>Product type</dt>
            <dd>Personal tracking app, not a medical application.</dd>
          </div>
          <div>
            <dt>Core model</dt>
            <dd>Ad-free and no subscription gate for baseline functionality.</dd>
          </div>
          <div>
            <dt>Data posture</dt>
            <dd>No ads, no sale of personal data, no unrelated third-party sharing.</dd>
          </div>
        </dl>
      </Panel>

      <Panel
        description="This copy matches the project disclaimer and should remain visible in the product."
        title="Important notice"
      >
        <p className="notice">
          femi is not a medical app and does not provide medical advice, diagnosis, or treatment
          recommendations.
        </p>
      </Panel>
    </>
  );
}
