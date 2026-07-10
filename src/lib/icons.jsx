// Stylish icon set — Phosphor icons re-exported under the names the app already
// uses (formerly lucide-react). Decorative icons render as "duotone" for a premium
// two-tone look; small UI-chrome icons render as crisp "bold". Swapping the import
// path from "@/lib/icons" to "@/lib/icons" upgrades every screen at once.
import {
  Warning as PhWarning,
  ArrowRight as PhArrowRight,
  Medal as PhMedal,
  Bed as PhBed,
  Bell as PhBell,
  BookOpen as PhBookOpen,
  Briefcase as PhBriefcase,
  CalendarCheck as PhCalendarCheck,
  CalendarDots as PhCalendarDots,
  Calendar as PhCalendar,
  CalendarX as PhCalendarX,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  CaretDown as PhCaretDown,
  CaretRight as PhCaretRight,
  ClipboardText as PhClipboardText,
  Clock as PhClock,
  CreditCard as PhCreditCard,
  DownloadSimple as PhDownload,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  ChartBar as PhChartBar,
  FileText as PhFileText,
  FileX as PhFileX,
  GraduationCap as PhGraduationCap,
  Handshake as PhHandshake,
  ClockCounterClockwise as PhHistory,
  House as PhHouse,
  Info as PhInfo,
  Key as PhKey,
  ListChecks as PhListChecks,
  CircleNotch as PhCircleNotch,
  SignOut as PhSignOut,
  MapPin as PhMapPin,
  List as PhList,
  Printer as PhPrinter,
  Receipt as PhReceipt,
  ArrowsClockwise as PhArrowsClockwise,
  Repeat as PhRepeat,
  FloppyDisk as PhFloppyDisk,
  MagnifyingGlass as PhSearch,
  PaperPlaneTilt as PhSend,
  Truck as PhTruck,
  Buildings as PhBuildings,
  ShieldCheck as PhShieldCheck,
  Sparkle as PhSparkle,
  Ticket as PhTicket,
  Trophy as PhTrophy,
  User as PhUser,
  Users as PhUsers,
  Wallet as PhWallet,
  X as PhX,
  XCircle as PhXCircle,
  ArrowLeft as PhArrowLeft,
  ArrowUpRight as PhArrowUpRight,
  ArrowUp as PhArrowUp,
  Plus as PhPlus,
  ChatCircle as PhChatCircle,
  PushPin as PhPushPin,
  ArrowSquareOut as PhArrowSquareOut,
  Coffee as PhCoffee,
  Camera as PhCamera,
  Stack as PhStack,
  SquaresFour as PhSquaresFour,
  Megaphone as PhMegaphone,
  ChatCircleDots as PhChat,
  PencilSimple as PhPencil,
  Star as PhStar,
  Trash as PhTrash,
  TrendUp as PhTrendUp,
  UploadSimple as PhUpload,
  CloudArrowUp as PhUploadCloud,
  HandWaving as PhHandWaving,
  LockKey as PhLockKey,
  SignIn as PhSignIn,
  Palette as PhPalette,
  Copy as PhCopy,
  ArrowsOut as PhArrowsOut,
  ArrowsIn as PhArrowsIn,
} from "@phosphor-icons/react";

const DUO = "duotone";
const BOLD = "bold";

// Wrap a Phosphor icon so it defaults to a weight but still accepts className/size/etc.
function make(Comp, weight) {
  const Icon = ({ weight: w, ...props }) => <Comp weight={w || weight} {...props} />;
  Icon.displayName = Comp.displayName || "Icon";
  return Icon;
}

// ── UI chrome (crisp, bold) ──
export const ArrowRight = make(PhArrowRight, BOLD);
export const Check = make(PhCheck, BOLD);
export const ChevronDown = make(PhCaretDown, BOLD);
export const ChevronRight = make(PhCaretRight, BOLD);
export const X = make(PhX, BOLD);
export const RefreshCw = make(PhArrowsClockwise, BOLD);
export const Search = make(PhSearch, BOLD);
export const Menu = make(PhList, BOLD);
export const Loader2 = make(PhCircleNotch, BOLD);
export const Eye = make(PhEye, BOLD);
export const EyeOff = make(PhEyeSlash, BOLD);

// ── Decorative / feature icons (premium duotone) ──
export const AlertTriangle = make(PhWarning, DUO);
export const Award = make(PhMedal, DUO);
export const BedDouble = make(PhBed, DUO);
export const Bell = make(PhBell, DUO);
export const BookOpen = make(PhBookOpen, DUO);
export const Briefcase = make(PhBriefcase, DUO);
export const CalendarCheck = make(PhCalendarCheck, DUO);
export const CalendarClock = make(PhCalendarDots, DUO);
export const CalendarDays = make(PhCalendar, DUO);
export const CalendarX = make(PhCalendarX, DUO);
export const CheckCircle2 = make(PhCheckCircle, DUO);
export const ClipboardList = make(PhClipboardText, DUO);
export const Clock = make(PhClock, DUO);
export const CreditCard = make(PhCreditCard, DUO);
export const Download = make(PhDownload, BOLD);
export const FileBarChart = make(PhChartBar, DUO);
export const FileText = make(PhFileText, DUO);
export const FileWarning = make(PhFileX, DUO);
export const GraduationCap = make(PhGraduationCap, DUO);
export const HeartHandshake = make(PhHandshake, DUO);
export const History = make(PhHistory, DUO);
export const Home = make(PhHouse, DUO);
export const Info = make(PhInfo, DUO);
export const KeyRound = make(PhKey, DUO);
export const ListChecks = make(PhListChecks, DUO);
export const LogOut = make(PhSignOut, DUO);
export const MapPin = make(PhMapPin, DUO);
export const Printer = make(PhPrinter, DUO);
export const Receipt = make(PhReceipt, DUO);
export const Repeat = make(PhRepeat, DUO);
export const Save = make(PhFloppyDisk, DUO);
export const Send = make(PhSend, DUO);
export const Truck = make(PhTruck, DUO);
export const Buildings = make(PhBuildings, DUO);
export const ShieldCheck = make(PhShieldCheck, DUO);
export const Sparkles = make(PhSparkle, DUO);
export const Ticket = make(PhTicket, DUO);
export const Trophy = make(PhTrophy, DUO);
export const User = make(PhUser, DUO);
export const Users = make(PhUsers, DUO);
export const Wallet = make(PhWallet, DUO);
export const XCircle = make(PhXCircle, DUO);

// ── additional ──
export const ArrowLeft = make(PhArrowLeft, BOLD);
export const ArrowUpRight = make(PhArrowUpRight, BOLD);
export const ArrowUp = make(PhArrowUp, BOLD);
export const Plus = make(PhPlus, BOLD);
export const MessageCircle = make(PhChatCircle, BOLD);
export const Pin = make(PhPushPin, BOLD);
export const ExternalLink = make(PhArrowSquareOut, BOLD);
export const Coffee = make(PhCoffee, DUO);
export const Camera = make(PhCamera, BOLD);
export const Trash2 = make(PhTrash, BOLD);
export const Pencil = make(PhPencil, BOLD);
export const ClipboardCheck = make(PhClipboardText, DUO);
export const Layers = make(PhStack, DUO);
export const LayoutGrid = make(PhSquaresFour, DUO);
export const Megaphone = make(PhMegaphone, DUO);
export const MessageSquareHeart = make(PhChat, DUO);
export const Star = make(PhStar, DUO);
export const TrendingUp = make(PhTrendUp, DUO);
export const Upload = make(PhUpload, DUO);
export const UploadCloud = make(PhUploadCloud, DUO);
export const HandWaving = make(PhHandWaving, DUO);
export const Lock = make(PhLockKey, DUO);
export const LogIn = make(PhSignIn, BOLD);
export const Palette = make(PhPalette, DUO);
export const Copy = make(PhCopy, BOLD);
export const Maximize = make(PhArrowsOut, BOLD);
export const Minimize = make(PhArrowsIn, BOLD);
