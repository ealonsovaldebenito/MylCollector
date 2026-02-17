import { SettingsClient } from './settings-client';

export const metadata = {
  title: 'Configuración - MYL Deck Builder',
  description: 'Gestiona tu cuenta y preferencias',
};

export default function SettingsPage() {
  return <SettingsClient />;
}

