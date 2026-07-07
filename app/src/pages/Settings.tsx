import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { db, updateProfile } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, User, Bell, Shield, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [defaultBroker, setDefaultBroker] = useState(userProfile?.settings?.defaultBroker || "");
  const [defaultAccount, setDefaultAccount] = useState(userProfile?.settings?.defaultAccount || "");
  const [defaultCurrency, setDefaultCurrency] = useState(userProfile?.settings?.defaultCurrency || "USD");
  const [riskPerTrade, setRiskPerTrade] = useState(userProfile?.settings?.riskPerTrade?.toString() || "1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setDefaultBroker(userProfile.settings?.defaultBroker || "");
      setDefaultAccount(userProfile.settings?.defaultAccount || "");
      setDefaultCurrency(userProfile.settings?.defaultCurrency || "USD");
      setRiskPerTrade(userProfile.settings?.riskPerTrade?.toString() || "1");
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        updatedAt: new Date().toISOString(),
      });
      await refreshUserProfile();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and trading preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Trading Preferences
            </CardTitle>
            <CardDescription>Configure your default trading settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultBroker">Default Broker</Label>
                <Input id="defaultBroker" value={defaultBroker} onChange={(e) => setDefaultBroker(e.target.value)} placeholder="e.g., OANDA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultAccount">Default Account</Label>
                <Input id="defaultAccount" value={defaultAccount} onChange={(e) => setDefaultAccount(e.target.value)} placeholder="e.g., Main" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Input id="defaultCurrency" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} placeholder="USD" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskPerTrade">Default Risk % per Trade</Label>
                <Input id="riskPerTrade" type="number" step="0.1" min="0.1" max="100" value={riskPerTrade} onChange={(e) => setRiskPerTrade(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Currently: {theme === "system" ? "System default" : theme === "dark" ? "On" : "Off"}
                </p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
