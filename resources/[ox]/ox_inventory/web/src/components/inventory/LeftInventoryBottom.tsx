import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectLeftInventoryBottom } from '../../store/inventory';

const LeftInventoryBottom: React.FC = () => {
  const leftInventoryBottom = useAppSelector(selectLeftInventoryBottom);

  return <InventoryGrid inventory={leftInventoryBottom} />;
};

export default LeftInventoryBottom;
