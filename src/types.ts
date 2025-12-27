export interface SwayamSettings {
  status: number,
  data: {
    theme: string,
    tenant_name: string,
    image_url: string,
    company_name_logo_url: string,
  }
}

export interface PaymentAccount {
  id: number;
  name: string;
  amount: number | null;
  isAlert: boolean;
  advanceNoticeDays: number;
  cutOffTime: string;
  weekSchedule: string;
  defaultValues: number[];
}

export interface CartItem extends Omit<PaymentAccount, "amount"> {
  alertDate: Date | null;
  amount: number;
  entryId: string;
}

export interface Event {
  name: string;
  start_date: string;
  end_date: string;
}