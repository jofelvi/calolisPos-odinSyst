import { Customer } from '@/modelTypes/customer';
import { customerService } from '@/services/firebase/genericServices';

export const searchCustomers = async (
  queryText: string,
): Promise<Customer[]> => {
  const customers = await customerService.getAll();
  return customers.filter(
    (c) =>
      c.name.toLowerCase().includes(queryText.toLowerCase()) ||
      c.phone?.includes(queryText) ||
      c.identificationId?.includes(queryText),
  );
};
