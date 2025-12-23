import { authClient } from "@/lib/auth-client";
import {
  AccountSettingsCards,
  ChangePasswordCard,
  DeleteAccountCard,
} from "@daveyplate/better-auth-ui";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  if (!session?.user) {
    navigate("/auth/signin");
  }
  return (
    <div className="w-full p-4 flex flex-col gap-6 py-12 justify-center items-center min-h-[90vh]">
      <AccountSettingsCards
        classNames={{
          card: {
            base: "bg-black/10 ring ring-indigo-950 max-w-xl mx-auto",
            footer: "bg-black/10 ring ring-indigo-950",
          },
        }}
      />
      <div className="w-full">
        <ChangePasswordCard
          classNames={{
            base: "bg-black/10 ring ring-indigo-950 max-w-xl mx-auto",
            footer: "bg-black/10 ring ring-indigo-950",
          }}
        />
      </div>

      <div className="w-full">
        <DeleteAccountCard
          classNames={{
            base: "bg-black/10 ring ring-indigo-950 max-w-xl mx-auto",
            footer: "bg-black/10 ring ring-indigo-950",
          }}
        />
      </div>
    </div>
  );
};

export default Settings;
