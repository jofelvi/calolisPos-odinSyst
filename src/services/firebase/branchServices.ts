// services/firebase/branchServices.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
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

  // Convert Firebase structure to domain model structure
  return {
    currency: data.currency || 'USD',
    language: data.locale?.split('-')[0] || 'es', // Extract language from locale
    timezone: data.timezone || 'America/Caracas',
    dateFormat: 'DD/MM/YYYY', // Default format
    taxRate: (data.taxRate || 0) * 100, // Convert from decimal to percentage
    enableTips: data.tipEnabled ?? false,
    defaultTipPercentage: data.tipPercentageSuggestions?.[0] || 0,
    businessHours: data.businessHours || {
      monday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
      saturday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
      sunday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
    },
    paymentMethods: data.enabledPaymentMethods || {
      cash: true,
      card: true,
      digitalWallet: true,
      bankTransfer: true,
    },
    receiptSettings: {
      showLogo: true,
      showTaxNumber: data.receiptShowTaxId ?? true,
      footerMessage: data.receiptFooterMessage || 'Gracias por su compra',
      autoprint: false,
    },
    notifications: data.emailNotifications || {
      lowStock: true,
      newOrders: true,
      dailyReports: false,
      systemAlerts: true,
    },
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
    );

    const snapshot = await getDocs(q);
    const branches = snapshot.docs.map(convertBranchFromFirestore);

    // Filter active branches and sort in memory
    return branches
      .filter((branch) => branch.isActive)
      .sort((a, b) => {
        // Sort by isDefault first (true first), then by name
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
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
    console.log('Creating new branch:', branchData);

    try {
      const docRef = await addDoc(collection(db, BRANCHES_COLLECTION), {
        ...branchData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('Branch created with ID:', docRef.id);

      const newBranch = await this.getById(docRef.id);
      if (!newBranch) throw new Error('Failed to create branch');

      console.log('New branch retrieved:', newBranch);
      return newBranch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
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
    // Create Firebase structure
    const firebaseSettings = {
      branchId,
      currency: CurrencyEnum.USD,
      locale: 'es-VE',
      timezone: 'America/Caracas',
      taxRate: 0.17, // stored as decimal in Firebase
      taxName: 'IVA',
      taxIncluded: false,
      serviceChargeEnabled: true,
      serviceChargeRate: 0.1,
      serviceChargeName: 'Cargo por servicio',
      tipEnabled: true,
      tipSuggestions: [1, 2, 3, 5],
      tipPercentageSuggestions: [10, 15, 20],
      receiptFooterMessage: 'Gracias por su compra',
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
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, BRANCH_SETTINGS_COLLECTION), {
      ...firebaseSettings,
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
    console.log('Updating branch settings:', { branchId, updates, userId });

    const q = query(
      collection(db, BRANCH_SETTINGS_COLLECTION),
      where('branchId', '==', branchId),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.error('Branch settings not found for branchId:', branchId);
      throw new Error('Branch settings not found');
    }

    console.log('Found branch settings document:', snapshot.docs[0].id);

    // Convert domain model updates to Firebase structure
    const firebaseUpdates: Record<string, unknown> = {};

    if (updates.currency) firebaseUpdates.currency = updates.currency;
    if (updates.language) firebaseUpdates.locale = `${updates.language}-VE`;
    if (updates.timezone) firebaseUpdates.timezone = updates.timezone;
    if (updates.dateFormat) firebaseUpdates.dateFormat = updates.dateFormat;
    if (updates.taxRate !== undefined)
      firebaseUpdates.taxRate = updates.taxRate / 100; // Convert from percentage to decimal
    if (updates.enableTips !== undefined)
      firebaseUpdates.tipEnabled = updates.enableTips;
    if (updates.defaultTipPercentage !== undefined) {
      firebaseUpdates.tipPercentageSuggestions = [updates.defaultTipPercentage];
    }

    console.log('Firebase updates to apply:', firebaseUpdates);

    const docRef = doc(db, BRANCH_SETTINGS_COLLECTION, snapshot.docs[0].id);

    try {
      await updateDoc(docRef, {
        ...firebaseUpdates,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
      console.log('Branch settings updated successfully');
    } catch (error) {
      console.error('Error updating branch settings:', error);
      throw error;
    }
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
    );

    const snapshot = await getDocs(q);
    const organizations = snapshot.docs.map(convertOrganizationFromFirestore);

    // Filter active organizations and sort in memory
    return organizations
      .filter((org) => org.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
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
    );

    const snapshot = await getDocs(q);
    const userBranches = snapshot.docs.map(convertUserBranchFromFirestore);

    // Filter active branches and sort in memory
    return userBranches
      .filter((ub) => ub.isActive)
      .sort((a, b) => {
        // Sort by isDefault first (true first), then by createdAt
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
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
