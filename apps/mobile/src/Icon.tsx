import {
  Activity,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Cylinder,
  Droplets,
  Info,
  Layers,
  LocateFixed,
  LogOut,
  Map as MapIcon,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  Route,
  Settings,
  ShieldCheck,
  Smartphone,
  Sun,
  ThermometerSun,
  Trash2,
  TriangleAlert,
  Truck,
  Upload,
  UserRound,
  X,
  Camera,
} from "lucide-react-native";
import { useTheme } from "./theme/ThemeProvider";

const icons = {
  map: MapIcon,
  camera: Camera,
  locate: LocateFixed,
  layers: Layers,
  route: Route,
  droplets: Droplets,
  tank: Cylinder,
  activity: Activity,
  warning: TriangleAlert,
  user: UserRound,
  settings: Settings,
  sun: Sun,
  moon: Moon,
  system: Smartphone,
  device: Smartphone,
  logout: LogOut,
  refresh: RefreshCw,
  check: Check,
  back: ArrowLeft,
  close: X,
  upload: Upload,
  shield: ShieldCheck,
  clock: Clock,
  info: Info,
  trash: Trash2,
  chevron: ChevronRight,
  truck: Truck,
  heat: ThermometerSun,
  plus: Plus,
  minus: Minus,
} as const;
export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const { colors } = useTheme();
  const Component = icons[name];
  return (
    <Component
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      size={size}
      color={color ?? colors.text}
      strokeWidth={strokeWidth}
    />
  );
}
