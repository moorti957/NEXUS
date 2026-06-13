import { useEffect, useState } from "react";
import api from "../services/api";

import Profile from "./Profile";
import ClientProfile from "./ClientProfile";

export default function ProfileRouter() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/profile");

      setProfile(res.data.data.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return profile?.accountType === "Client"
    ? <ClientProfile />
    : <Profile />;
}