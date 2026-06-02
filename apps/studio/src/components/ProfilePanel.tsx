import type { StudioProfile } from "../types";

type ProfilePanelProps = {
  profiles: StudioProfile[];
  selectedProfilePath: string;
  selectedProfile?: StudioProfile;
  onSelectProfile: (profilePath: string) => void;
};

export function ProfilePanel({
  profiles,
  selectedProfilePath,
  selectedProfile,
  onSelectProfile
}: ProfilePanelProps) {
  return (
    <section className="panel compact-panel" aria-label="Layout profile">
      <div className="panel-header">
        <div>
          <h2>Profile</h2>
          <p>{selectedProfile?.id ?? "None"}</p>
        </div>
      </div>
      <select
        className="profile-select"
        aria-label="Select layout profile"
        value={selectedProfilePath}
        onChange={(event) => onSelectProfile(event.target.value)}
      >
        {profiles.map((profile) => (
          <option key={profile.path} value={profile.path}>
            {profile.name}
          </option>
        ))}
      </select>
      <dl className="metadata-list">
        <div>
          <dt>Path</dt>
          <dd>{selectedProfile?.path ?? "-"}</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{selectedProfile?.description ?? "-"}</dd>
        </div>
      </dl>
    </section>
  );
}
