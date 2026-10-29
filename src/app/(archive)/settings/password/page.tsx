import { PageHeading } from "@/components/archive";
import { SettingsForm } from "@/components/forms";
export default function Password() {
  return (
    <>
      <PageHeading
        title="A fresh start."
        description="Choose a new password with at least 12 characters."
      />
      <SettingsForm kind="password" />
    </>
  );
}
