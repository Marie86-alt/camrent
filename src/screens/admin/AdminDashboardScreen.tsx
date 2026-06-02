import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '../../components/BrandLogo';
import { Screen } from '../../components/Screen';
import { subscribeToAllBookings, subscribeToAllUsers } from '../../services/adminService';
import { logout } from '../../services/authService';
import { subscribeToAllCars } from '../../services/carService';
import { hasFirebaseConfig } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import type { AppUser, Booking, Car } from '../../types/models';
import type { AdminTabParamList } from '../../types/navigation';
import { formatFcfa } from '../../utils/currency';

type DashNavProp = BottomTabNavigationProp<AdminTabParamList, 'AdminHome'>;

const TEXT = {
  approvedVehicles: 'V\u00e9hicules approuv\u00e9s',
  cancelledBookings: 'R\u00e9servations annul\u00e9es',
  confirmedBookings: 'R\u00e9servations confirm\u00e9es',
  failedPayments: 'Paiements \u00e9chou\u00e9s',
  kycApproved: 'KYC valid\u00e9s',
  pendingVehicles: 'V\u00e9hicules \u00e0 valider',
  platformSummary: 'R\u00e9sum\u00e9 plateforme',
  rejectedVehicles: 'V\u00e9hicules rejet\u00e9s',
  reservations: 'R\u00e9servations',
  totalRevenue: 'Volume total encaiss\u00e9',
  users: 'Utilisateurs',
  vehicles: 'V\u00e9hicules',
  view: 'Voir ->',
};

type AlertCardProps = {
  bg: string;
  border: string;
  count: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  onPress?: () => void;
};

function AlertCard({ bg, border, count, icon, iconColor, label, onPress }: AlertCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: '44%',
        borderRadius: 16,
        padding: 16,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <View
        style={{
          height: 40,
          width: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconColor + '22',
        }}
      >
        <Ionicons color={iconColor} name={icon} size={20} />
      </View>
      <Text
        style={{
          marginTop: 12,
          fontSize: 26,
          fontWeight: '900',
          color: count > 0 ? iconColor : '#1e293b',
        }}
      >
        {count}
      </Text>
      <Text style={{ marginTop: 2, fontSize: 11, fontWeight: '600', color: '#64748b' }}>
        {label}
      </Text>
      {onPress ? (
        <Text style={{ marginTop: 6, fontSize: 10, fontWeight: '700', color: iconColor }}>{TEXT.view}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 py-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className={`font-black ${danger && value > 0 ? 'text-red-600' : 'text-slate-950'}`}>
        {value}
      </Text>
    </View>
  );
}

export function AdminDashboardScreen() {
  const navigation = useNavigation<DashNavProp>();
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!hasFirebaseConfig) return;

    const u1 = subscribeToAllCars((items) => setCars(items), () => {});
    const u2 = subscribeToAllUsers((items) => setUsers(items), () => {});
    const u3 = subscribeToAllBookings((items) => setBookings(items), () => {});
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const pendingVehicles = cars.filter((c) => c.adminStatus === 'pending_review').length;
  const pendingKyc = users.filter(
    (u) => u.kycStatus === 'pending' || u.status === 'pending_validation',
  ).length;
  const openDisputes = bookings.filter((b) => b.disputeStatus === 'open').length;
  const failedPayments = bookings.filter((b) => b.paymentStatus === 'failed').length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <Screen scroll={false} topSafeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8 pt-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <BrandLogo variant="compact" />
              <View>
                <Text className="text-xs text-slate-400">Panel d'administration</Text>
                <Text className="text-lg font-black text-slate-950">
                  Bonjour, {user?.fullName?.split(' ')[0]}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
              onPress={logout}
              style={{
                borderWidth: 1,
                borderColor: '#fecaca',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              <Ionicons color="#b91c1c" name="log-out-outline" size={20} />
            </TouchableOpacity>
          </View>
          <View
            className="rounded-2xl bg-slate-950 p-5"
            style={{
              shadowColor: '#3B63D4',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 5,
            }}
          >
            <Text className="text-xs font-semibold text-slate-400">{TEXT.totalRevenue}</Text>
            <Text className="mt-1 text-3xl font-black text-white">
              {formatFcfa(totalRevenue)}
            </Text>
            <View className="mt-4 flex-row gap-6">
              <View>
                <Text className="text-xl font-black text-brand-blue">{cars.length}</Text>
                <Text className="text-xs text-slate-400">{TEXT.vehicles}</Text>
              </View>
              <View>
                <Text className="text-xl font-black text-white">
                  {users.filter((u) => u.role !== 'admin').length}
                </Text>
                <Text className="text-xs text-slate-400">{TEXT.users}</Text>
              </View>
              <View>
                <Text className="text-xl font-black text-white">{bookings.length}</Text>
                <Text className="text-xs text-slate-400">{TEXT.reservations}</Text>
              </View>
            </View>
          </View>
          <View>
            <Text className="mb-3 font-bold text-slate-950">Alertes en attente</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <AlertCard
                bg="#fffbeb"
                border="#fde68a"
                count={pendingVehicles}
                icon="car-sport-outline"
                iconColor="#ca8a04"
                label={TEXT.pendingVehicles}
                onPress={() => navigation.navigate('AdminVehicles')}
              />
              <AlertCard
                bg="#eff6ff"
                border="#bfdbfe"
                count={pendingKyc}
                icon="person-outline"
                iconColor="#2563eb"
                label="KYC en attente"
                onPress={() => navigation.navigate('AdminDrivers')}
              />
              <AlertCard
                bg="#fef2f2"
                border="#fecaca"
                count={openDisputes}
                icon="warning-outline"
                iconColor="#b91c1c"
                label="Litiges ouverts"
                onPress={() => navigation.navigate('AdminBookings')}
              />
              <AlertCard
                bg="#fef2f2"
                border="#fecaca"
                count={failedPayments}
                icon="close-circle-outline"
                iconColor="#b91c1c"
                label={TEXT.failedPayments}
                onPress={() => navigation.navigate('AdminMore')}
              />
            </View>
          </View>
          <View
            className="rounded-2xl bg-white p-4"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            <Text className="mb-1 text-base font-black text-slate-950">{TEXT.platformSummary}</Text>
            <SummaryRow
              label={TEXT.approvedVehicles}
              value={cars.filter((c) => c.adminStatus === 'approved').length}
            />
            <SummaryRow
              label={TEXT.rejectedVehicles}
              value={cars.filter((c) => c.adminStatus === 'rejected').length}
              danger
            />
            <SummaryRow
              label={TEXT.kycApproved}
              value={users.filter((u) => u.kycStatus === 'approved').length}
            />
            <SummaryRow
              label={TEXT.confirmedBookings}
              value={bookings.filter((b) => b.status === 'confirmed').length}
            />
            <SummaryRow
              label={TEXT.cancelledBookings}
              value={bookings.filter((b) => b.status === 'cancelled').length}
              danger
            />
            <SummaryRow
              label="Comptes suspendus/bannis"
              value={
                users.filter((u) => u.status === 'suspended' || u.status === 'banned').length
              }
              danger
            />
          </View>

        </View>
      </ScrollView>
    </Screen>
  );
}
