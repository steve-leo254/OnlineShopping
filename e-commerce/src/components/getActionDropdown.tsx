import OrderActionDropdown from './OrderActionDropdown';

const getActionDropdown = (status: string, orderId: number, onCancel: () => void) => {
  return OrderActionDropdown({ status, orderId, onCancel });
};

export default getActionDropdown;