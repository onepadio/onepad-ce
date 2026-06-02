export interface Profile {
  id: string;
  name: string;
  partition: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isGuest: boolean;
  email: string;
  userId: string;
  passCode: string;
  orgId: string;
  createdAt: number;
}
