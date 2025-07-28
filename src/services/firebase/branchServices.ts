// services/firebase/branchServices.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Branch, BranchSettings } from '@/modelTypes/branch';
import { Organization } from '@/modelTypes/organization';
import { UserBranch } from '@/modelTypes/userBranch';
import { convertFirebaseDate } from '@/shared/utils/dateHelpers';
import { db } from '@/services/firebase/firebase';
import { CurrencyEnum } from '@/shared';

// Collections
const BRANCHES_COLLECTION = 'branches';
const BRANCH_SETTINGS_COLLECTION = 'branchSettings';
const ORGANIZATIONS_COLLECTION = 'organizations';
const USER_BRANCHES_COLLECTION = 'userBranches';

// Type converters
const convertBranchFromFirestore = (
  doc: QueryDocumentSnapshot<DocumentData>,
): Branch => {
  const data = doc.data();
  return {
    id: doc.id,
    organizationId: data.organizationId,
    name: data.name,
    description: data.description,
    email: data.email,
    phone: data.phone,
    country: data.country,
    city: data.city,
    location: data.location,
    businessRegistration: data.businessRegistration,
    taxId: data.taxId,
    isActive: data.isActive,
    isDefault: data.isDefault,
    createdAt: convertFirebaseDate(data.createdAt),
    updatedAt: convertFirebaseDate(data.updatedAt),
    createdBy: data.createdBy,
  };
};

const convertBranchSettingsFromFirestore = (
  doc: QueryDocumentSnapshot<DocumentData>,
): BranchSettings => {
  const data = doc.data();
  return {
    id: doc.id,
    branchId: data.branchId,
    currency: data.currency,
    locale: data.locale,
    timezone: data.timezone,
    taxRate: data.taxRate,
    taxName: data.taxName,
    taxIncluded: data.taxIncluded,
    serviceChargeEnabled: data.serviceChargeEnabled,
    serviceChargeRate: data.serviceChargeRate,
    serviceChargeName: data.serviceChargeName,
    tipEnabled: data.tipEnabled,
    tipSuggestions: data.tipSuggestions,
    tipPercentageSuggestions: data.tipPercentageSuggestions,
    receiptFooterMessage: data.receiptFooterMessage,
    receiptShowTaxId: data.receiptShowTaxId,
    receiptShowLocation: data.receiptShowLocation,
    allowNegativeInventory: data.allowNegativeInventory,
    requireCustomerForOrders: data.requireCustomerForOrders,
    autoGenerateOrderNumbers: data.autoGenerateOrderNumbers,
    orderNumberPrefix: data.orderNumberPrefix,
    businessHours: data.businessHours,
    enabledPaymentMethods: data.enabledPaymentMethods,
    emailNotifications: data.emailNotifications,
    integrations: data.integrations,
    createdAt: convertFirebaseDate(data.createdAt),
    updatedAt: convertFirebaseDate(data.updatedAt),
    updatedBy: data.updatedBy,
  };
};

const convertOrganizationFromFirestore = (
  doc: QueryDocumentSnapshot<DocumentData>,
): Organization => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    subscriptionPlan: data.subscriptionPlan,
    subscriptionStatus: data.subscriptionStatus,
    subscriptionStartDate: convertFirebaseDate(data.subscriptionStartDate),
    subscriptionEndDate: data.subscriptionEndDate
      ? convertFirebaseDate(data.subscriptionEndDate)
      : undefined,
    maxBranches: data.maxBranches,
    isActive: data.isActive,
    createdAt: convertFirebaseDate(data.createdAt),
    updatedAt: convertFirebaseDate(data.updatedAt),
  };
};

const convertUserBranchFromFirestore = (
  doc: QueryDocumentSnapshot<DocumentData>,
): UserBranch => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    branchId: data.branchId,
    organizationId: data.organizationId,
    role: data.role,
    permissions: data.permissions,
    isActive: data.isActive,
    isDefault: data.isDefault,
    createdAt: convertFirebaseDate(data.createdAt),
    updatedAt: convertFirebaseDate(data.updatedAt),
    invitedBy: data.invitedBy,
    acceptedAt: data.acceptedAt
      ? convertFirebaseDate(data.acceptedAt)
      : undefined,
  };
};

// Branch Services
export const branchService = {
  // Get all branches for an organization
  async getByOrganization(organizationId: string): Promise<Branch[]> {
    const q = query(
      collection(db, BRANCHES_COLLECTION),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true),
      orderBy('isDefault', 'desc'),
      orderBy('name', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertBranchFromFirestore);
  },

  // Get branch by ID
  async getById(id: string): Promise<Branch | null> {
    const docRef = doc(db, BRANCHES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertBranchFromFirestore(
        docSnap as QueryDocumentSnapshot<DocumentData>,
      );
    }
    return null;
  },

  // Create new branch
  async create(branchData: Omit<Branch, 'id'>): Promise<Branch> {
    const docRef = await addDoc(collection(db, BRANCHES_COLLECTION), {
      ...branchData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newBranch = await this.getById(docRef.id);
    if (!newBranch) throw new Error('Failed to create branch');
    return newBranch;
  },

  // Update branch
  async update(id: string, updates: Partial<Branch>): Promise<void> {
    const docRef = doc(db, BRANCHES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete branch (soft delete)
  async delete(id: string): Promise<void> {
    const docRef = doc(db, BRANCHES_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  // Set as default branch for organization
  async setAsDefault(branchId: string, organizationId: string): Promise<void> {
    // First, remove default from all branches in organization
    const branches = await this.getByOrganization(organizationId);
    const updatePromises = branches.map((branch) =>
      this.update(branch.id, { isDefault: false }),
    );
    await Promise.all(updatePromises);

    // Set the selected branch as default
    await this.update(branchId, { isDefault: true });
  },
};

// Branch Settings Services
export const branchSettingsService = {
  // Get settings by branch ID
  async getByBranchId(branchId: string): Promise<BranchSettings | null> {
    const q = query(
      collection(db, BRANCH_SETTINGS_COLLECTION),
      where('branchId', '==', branchId),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return convertBranchSettingsFromFirestore(snapshot.docs[0]);
  },

  // Create default settings for new branch
  async createDefault(
    branchId: string,
    userId: string,
  ): Promise<BranchSettings> {
    const defaultSettings: Omit<BranchSettings, 'id'> = {
      branchId,
      currency: CurrencyEnum.USD,
      locale: 'es-VE',
      timezone: 'America/Caracas',
      taxRate: 0.17,
      taxName: 'IVA',
      taxIncluded: false,
      serviceChargeEnabled: true,
      serviceChargeRate: 0.1,
      serviceChargeName: 'Cargo por servicio',
      tipEnabled: true,
      tipSuggestions: [1, 2, 3, 5],
      tipPercentageSuggestions: [10, 15, 20],
      receiptShowTaxId: true,
      receiptShowLocation: true,
      allowNegativeInventory: false,
      requireCustomerForOrders: false,
      autoGenerateOrderNumbers: true,
      orderNumberPrefix: 'ORD-',
      businessHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '22:00' },
      },
      enabledPaymentMethods: {
        cash: true,
        card: true,
        transfer: true,
        pagoMovil: true,
      },
      emailNotifications: {
        newOrders: true,
        lowStock: true,
        dailyReports: false,
      },
      integrations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, BRANCH_SETTINGS_COLLECTION), {
      ...defaultSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newSettings = await this.getById(docRef.id);
    if (!newSettings) throw new Error('Failed to create branch settings');
    return newSettings;
  },

  // Get settings by ID
  async getById(id: string): Promise<BranchSettings | null> {
    const docRef = doc(db, BRANCH_SETTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertBranchSettingsFromFirestore(
        docSnap as QueryDocumentSnapshot<DocumentData>,
      );
    }
    return null;
  },

  // Update settings
  async update(
    branchId: string,
    updates: Partial<BranchSettings>,
    userId: string,
  ): Promise<void> {
    const q = query(
      collection(db, BRANCH_SETTINGS_COLLECTION),
      where('branchId', '==', branchId),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Branch settings not found');
    }

    const docRef = doc(db, BRANCH_SETTINGS_COLLECTION, snapshot.docs[0].id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },
};

// Organization Services
export const organizationService = {
  // Get organization by ID
  async getById(id: string): Promise<Organization | null> {
    const docRef = doc(db, ORGANIZATIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertOrganizationFromFirestore(
        docSnap as QueryDocumentSnapshot<DocumentData>,
      );
    }
    return null;
  },

  // Get organizations by owner
  async getByOwner(ownerId: string): Promise<Organization[]> {
    const q = query(
      collection(db, ORGANIZATIONS_COLLECTION),
      where('ownerId', '==', ownerId),
      where('isActive', '==', true),
      orderBy('name', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertOrganizationFromFirestore);
  },

  // Create organization
  async create(orgData: Omit<Organization, 'id'>): Promise<Organization> {
    const docRef = await addDoc(collection(db, ORGANIZATIONS_COLLECTION), {
      ...orgData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newOrg = await this.getById(docRef.id);
    if (!newOrg) throw new Error('Failed to create organization');
    return newOrg;
  },

  // Update organization
  async update(id: string, updates: Partial<Organization>): Promise<void> {
    const docRef = doc(db, ORGANIZATIONS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },
};

// User Branch Services
export const userBranchService = {
  // Get branches for user
  async getByUserId(userId: string): Promise<UserBranch[]> {
    const q = query(
      collection(db, USER_BRANCHES_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('isDefault', 'desc'),
      orderBy('createdAt', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertUserBranchFromFirestore);
  },

  // Add user to branch
  async addUserToBranch(
    userBranchData: Omit<UserBranch, 'id'>,
  ): Promise<UserBranch> {
    const docRef = await addDoc(collection(db, USER_BRANCHES_COLLECTION), {
      ...userBranchData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newUserBranch = await this.getById(docRef.id);
    if (!newUserBranch) throw new Error('Failed to add user to branch');
    return newUserBranch;
  },

  // Get by ID
  async getById(id: string): Promise<UserBranch | null> {
    const docRef = doc(db, USER_BRANCHES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertUserBranchFromFirestore(
        docSnap as QueryDocumentSnapshot<DocumentData>,
      );
    }
    return null;
  },

  // Update user branch
  async update(id: string, updates: Partial<UserBranch>): Promise<void> {
    const docRef = doc(db, USER_BRANCHES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Set default branch for user
  async setDefaultBranch(userId: string, branchId: string): Promise<void> {
    // First, remove default from all user branches
    const userBranches = await this.getByUserId(userId);
    const updatePromises = userBranches.map((ub) =>
      this.update(ub.id, { isDefault: false }),
    );
    await Promise.all(updatePromises);

    // Set the selected branch as default
    const targetUserBranch = userBranches.find(
      (ub) => ub.branchId === branchId,
    );
    if (targetUserBranch) {
      await this.update(targetUserBranch.id, { isDefault: true });
    }
  },

  // Remove user from branch
  async removeUserFromBranch(userId: string, branchId: string): Promise<void> {
    const q = query(
      collection(db, USER_BRANCHES_COLLECTION),
      where('userId', '==', userId),
      where('branchId', '==', branchId),
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },
};
