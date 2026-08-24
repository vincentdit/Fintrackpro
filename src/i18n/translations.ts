/**
 * Translation catalogs. `en` is the source of truth for the set of keys;
 * `sw` must provide the same keys (enforced by the Record type below).
 *
 * Interpolation: use {name} placeholders and pass vars to t(), e.g.
 *   t('accounts.syncImported', { count: 3 })
 */

export const en = {
  // Common
  'common.add': 'Add',
  'common.new': 'New',
  'common.delete': 'Delete',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.apply': 'Apply',
  'common.income': 'Income',
  'common.expense': 'Expense',
  'common.all': 'All',
  'common.thisMonth': 'this month',

  // Tabs
  'tab.dashboard': 'Dashboard',
  'tab.transactions': 'Transactions',
  'tab.budgets': 'Budgets',
  'tab.reports': 'Reports',
  'tab.accounts': 'Accounts',

  // Login
  'login.tagline':
    'Your money, organised. Track spending, set budgets, and connect your accounts — all in one place.',
  'login.email': 'Email',
  'login.continue': 'Continue',
  'login.secured':
    'Protected by device biometrics. This prototype stores data securely on your device.',

  // Dashboard
  'dash.welcome': 'Welcome back',
  'dash.totalBalance': 'Total balance',
  'dash.incomeMo': 'Income (mo)',
  'dash.spentMo': 'Spent (mo)',
  'dash.addTransaction': '+ Add transaction',
  'dash.linkBank': 'Link bank',
  'dash.budgetHealth': 'Budget health',
  'dash.recentActivity': 'Recent activity',

  // Transactions
  'tx.title': 'Transactions',
  'tx.empty': 'No transactions yet',
  'tx.emptySub': 'Add your first one to get started.',
  'tx.amount': 'Amount',
  'tx.description': 'Description',
  'tx.descriptionPlaceholder': 'e.g. Groceries at Shoprite',
  'tx.category': 'Category',
  'tx.account': 'Account',
  'tx.addBtn': 'Add transaction',
  'tx.saveBtn': 'Save changes',

  // Budgets & Goals
  'budgets.title': 'Budgets & Goals',
  'budgets.monthly': 'Monthly budgets',
  'budgets.emptyTitle': 'No budgets yet',
  'budgets.emptySub': 'Create a budget to keep spending on track.',
  'budgets.spent': 'spent',
  'budgets.left': 'left',
  'budgets.overBy': 'Over by',
  'budgets.goals': 'Savings goals',
  'budgets.goalsEmptyTitle': 'No goals yet',
  'budgets.goalsEmptySub': 'Set a savings goal and track your progress.',
  'budget.limit': 'Limit',
  'budget.period': 'Period',
  'budget.weekly': 'Weekly',
  'budget.monthly': 'Monthly',
  'budget.yearly': 'Yearly',
  'budget.createBtn': 'Create budget',
  'budget.saveBtn': 'Save budget',
  'budget.deleteBtn': 'Delete budget',

  // Goal editor
  'goal.progress': 'Progress',
  'goal.target': 'Target',
  'goal.addWithdraw': 'Add / withdraw',
  'goal.name': 'Name',
  'goal.namePlaceholder': 'e.g. Emergency Fund',
  'goal.icon': 'Icon',
  'goal.createBtn': 'Create goal',
  'goal.saveBtn': 'Save goal',
  'goal.deleteBtn': 'Delete goal',

  // Reports
  'reports.title': 'Reports',
  'reports.savedThisMonth': 'Saved this month',
  'reports.savingsRate': 'Savings rate',
  'reports.incomeVsExpense': 'Income vs expense (6 mo)',
  'reports.byCategory': 'Spending by category',
  'reports.noSpendTitle': 'No spending this month',
  'reports.noSpendSub': 'Your category breakdown will appear here.',

  // Accounts & Settings
  'accounts.title': 'Accounts',
  'accounts.netWorth': 'Net worth',
  'accounts.linkAccount': '+ Link a bank account',
  'accounts.linkedInstitutions': 'Linked institutions',
  'accounts.syncNow': 'Sync now',
  'accounts.syncing': 'Syncing…',
  'accounts.syncComplete': 'Sync complete',
  'accounts.syncImported': '{count} new transaction(s) imported.',
  'accounts.syncFailed': 'Sync failed',
  'accounts.tryAgain': 'Please try again.',
  'settings.title': 'Settings',
  'settings.baseCurrency': 'Base currency',
  'settings.language': 'Language',
  'settings.biometric': 'Biometric unlock',
  'settings.biometricSub': 'Require Face ID / fingerprint',
  'settings.resetDemo': 'Reset demo data',
  'settings.resetConfirm': 'Restore the sample accounts and transactions?',
  'settings.reset': 'Reset',
  'settings.signOut': 'Sign out',
  'settings.rates': 'Exchange rates',
  'settings.refreshRates': 'Refresh',
  'settings.ratesUpdating': 'Updating…',
  'settings.ratesUpdated': 'Updated {when}',
  'settings.ratesBundled': 'Using offline rates',
  'settings.rateNote': 'Balances are converted to your base currency at current rates.',
  'settings.account': 'Account',
  'settings.sync': 'Sync',
  'settings.syncNow': 'Sync now',
  'settings.syncing': 'Syncing…',
  'settings.synced': 'Last synced {when}',
  'settings.syncNever': 'Not synced yet',
  'settings.syncFailed': 'Sync failed',

  // Auth
  'auth.welcome': 'Welcome',
  'auth.subtitle': 'Sign in to keep your money in sync across your devices.',
  'auth.name': 'Name',
  'auth.namePlaceholder': 'Your name',
  'auth.password': 'Password',
  'auth.passwordHint': 'At least 6 characters',
  'auth.login': 'Log in',
  'auth.register': 'Create account',
  'auth.haveAccount': 'Have an account? Log in',
  'auth.noAccount': 'New here? Create an account',

  // Currency picker
  'currency.title': 'Base currency',
  'currency.subtitle': 'Amounts you enter and totals are shown in this currency.',

  // Link account
  'link.search': 'Search your bank…',
  'link.demoNote':
    'Demo mode: linking uses simulated bank data. Set EXPO_PUBLIC_DATA_SOURCE=plaid and connect your backend to link real accounts.',
  'link.link': 'Link →',

  // Modal titles
  'modal.transaction': 'Transaction',
  'modal.linkBank': 'Link a bank',
  'modal.budget': 'Budget',
  'modal.goal': 'Goal',
  'modal.categories': 'Categories',
  'modal.category': 'Category',

  // Categories
  'settings.categories': 'Categories',
  'categories.title': 'Categories',
  'category.name': 'Name',
  'category.namePlaceholder': 'e.g. Coffee',
  'category.kind': 'Type',
  'category.icon': 'Icon',
  'category.color': 'Color',
  'category.createBtn': 'Create category',
  'category.saveBtn': 'Save category',
  'category.deleteBtn': 'Delete category',
  'category.inUse': 'Used by {count} item(s). They keep it, but it won’t be selectable.',
  'category.reorderHint': 'Hold and drag to reorder.',
  'category.merge': 'Merge into another category',
  'category.mergeTitle': 'Merge “{name}” into',
  'category.mergeConfirm': 'Move {count} item(s) to “{target}” and remove “{name}”?',

  // Accounts
  'modal.account': 'Account',
  'account.add': '+ Add account',
  'account.name': 'Name',
  'account.namePlaceholder': 'e.g. Everyday',
  'account.institution': 'Institution',
  'account.institutionPlaceholder': 'e.g. CRDB Bank',
  'account.type': 'Type',
  'account.balance': 'Balance',
  'account.currency': 'Currency',
  'account.createBtn': 'Add account',
  'account.saveBtn': 'Save account',
  'account.deleteBtn': 'Delete account',
  'account.deleteConfirm': 'Delete this account and its {count} transaction(s)?',
  'accountType.checking': 'Checking',
  'accountType.savings': 'Savings',
  'accountType.credit': 'Credit',
  'accountType.cash': 'Cash',
  'accountType.investment': 'Investment',
} as const;

export type TKey = keyof typeof en;

export const sw: Record<TKey, string> = {
  'common.add': 'Ongeza',
  'common.new': 'Mpya',
  'common.delete': 'Futa',
  'common.cancel': 'Ghairi',
  'common.save': 'Hifadhi',
  'common.apply': 'Tekeleza',
  'common.income': 'Mapato',
  'common.expense': 'Matumizi',
  'common.all': 'Zote',
  'common.thisMonth': 'mwezi huu',

  'tab.dashboard': 'Dashibodi',
  'tab.transactions': 'Miamala',
  'tab.budgets': 'Bajeti',
  'tab.reports': 'Ripoti',
  'tab.accounts': 'Akaunti',

  'login.tagline':
    'Pesa zako, kwa mpangilio. Fuatilia matumizi, weka bajeti, na unganisha akaunti zako — mahali pamoja.',
  'login.email': 'Barua pepe',
  'login.continue': 'Endelea',
  'login.secured':
    'Imelindwa na bayometriki ya kifaa. Programu hii huhifadhi data kwa usalama kwenye kifaa chako.',

  'dash.welcome': 'Karibu tena',
  'dash.totalBalance': 'Salio jumla',
  'dash.incomeMo': 'Mapato (mwezi)',
  'dash.spentMo': 'Matumizi (mwezi)',
  'dash.addTransaction': '+ Ongeza muamala',
  'dash.linkBank': 'Unganisha benki',
  'dash.budgetHealth': 'Afya ya bajeti',
  'dash.recentActivity': 'Shughuli za hivi karibuni',

  'tx.title': 'Miamala',
  'tx.empty': 'Hakuna miamala bado',
  'tx.emptySub': 'Ongeza wa kwanza ili kuanza.',
  'tx.amount': 'Kiasi',
  'tx.description': 'Maelezo',
  'tx.descriptionPlaceholder': 'mf. Manunuzi Shoprite',
  'tx.category': 'Kategoria',
  'tx.account': 'Akaunti',
  'tx.addBtn': 'Ongeza muamala',
  'tx.saveBtn': 'Hifadhi mabadiliko',

  'budgets.title': 'Bajeti na Malengo',
  'budgets.monthly': 'Bajeti za mwezi',
  'budgets.emptyTitle': 'Hakuna bajeti bado',
  'budgets.emptySub': 'Tengeneza bajeti kudhibiti matumizi.',
  'budgets.spent': 'yametumika',
  'budgets.left': 'yamebaki',
  'budgets.overBy': 'Zaidi kwa',
  'budgets.goals': 'Malengo ya akiba',
  'budgets.goalsEmptyTitle': 'Hakuna malengo bado',
  'budgets.goalsEmptySub': 'Weka lengo la akiba na fuatilia maendeleo.',
  'budget.limit': 'Kikomo',
  'budget.period': 'Kipindi',
  'budget.weekly': 'Wiki',
  'budget.monthly': 'Mwezi',
  'budget.yearly': 'Mwaka',
  'budget.createBtn': 'Tengeneza bajeti',
  'budget.saveBtn': 'Hifadhi bajeti',
  'budget.deleteBtn': 'Futa bajeti',

  'goal.progress': 'Maendeleo',
  'goal.target': 'Lengo',
  'goal.addWithdraw': 'Ongeza / toa',
  'goal.name': 'Jina',
  'goal.namePlaceholder': 'mf. Akiba ya Dharura',
  'goal.icon': 'Ikoni',
  'goal.createBtn': 'Tengeneza lengo',
  'goal.saveBtn': 'Hifadhi lengo',
  'goal.deleteBtn': 'Futa lengo',

  'reports.title': 'Ripoti',
  'reports.savedThisMonth': 'Zilizohifadhiwa mwezi huu',
  'reports.savingsRate': 'Kiwango cha akiba',
  'reports.incomeVsExpense': 'Mapato na matumizi (miezi 6)',
  'reports.byCategory': 'Matumizi kwa kategoria',
  'reports.noSpendTitle': 'Hakuna matumizi mwezi huu',
  'reports.noSpendSub': 'Mchanganuo wa kategoria utaonekana hapa.',

  'accounts.title': 'Akaunti',
  'accounts.netWorth': 'Thamani halisi',
  'accounts.linkAccount': '+ Unganisha akaunti ya benki',
  'accounts.linkedInstitutions': 'Taasisi zilizounganishwa',
  'accounts.syncNow': 'Sasisha sasa',
  'accounts.syncing': 'Inasasisha…',
  'accounts.syncComplete': 'Usasishaji umekamilika',
  'accounts.syncImported': 'Miamala mipya {count} imeingizwa.',
  'accounts.syncFailed': 'Usasishaji umeshindikana',
  'accounts.tryAgain': 'Tafadhali jaribu tena.',
  'settings.title': 'Mipangilio',
  'settings.baseCurrency': 'Sarafu ya msingi',
  'settings.language': 'Lugha',
  'settings.biometric': 'Ufunguzi wa kibayometriki',
  'settings.biometricSub': 'Hitaji Face ID / alama ya kidole',
  'settings.resetDemo': 'Rejesha data ya mfano',
  'settings.resetConfirm': 'Rejesha akaunti na miamala ya mfano?',
  'settings.reset': 'Rejesha',
  'settings.signOut': 'Toka',
  'settings.rates': 'Viwango vya ubadilishaji',
  'settings.refreshRates': 'Sasisha',
  'settings.ratesUpdating': 'Inasasisha…',
  'settings.ratesUpdated': 'Imesasishwa {when}',
  'settings.ratesBundled': 'Inatumia viwango vya nje ya mtandao',
  'settings.rateNote': 'Salio hubadilishwa kuwa sarafu yako ya msingi kwa viwango vya sasa.',
  'settings.account': 'Akaunti',
  'settings.sync': 'Usawazishaji',
  'settings.syncNow': 'Sawazisha sasa',
  'settings.syncing': 'Inasawazisha…',
  'settings.synced': 'Ilisawazishwa {when}',
  'settings.syncNever': 'Bado haijasawazishwa',
  'settings.syncFailed': 'Usawazishaji umeshindikana',

  // Auth
  'auth.welcome': 'Karibu',
  'auth.subtitle': 'Ingia ili kuweka pesa zako sawa kwenye vifaa vyako vyote.',
  'auth.name': 'Jina',
  'auth.namePlaceholder': 'Jina lako',
  'auth.password': 'Nywila',
  'auth.passwordHint': 'Angalau herufi 6',
  'auth.login': 'Ingia',
  'auth.register': 'Fungua akaunti',
  'auth.haveAccount': 'Una akaunti? Ingia',
  'auth.noAccount': 'Mgeni? Fungua akaunti',

  'currency.title': 'Sarafu ya msingi',
  'currency.subtitle': 'Kiasi unachoingiza na jumla huonyeshwa kwa sarafu hii.',

  'link.search': 'Tafuta benki yako…',
  'link.demoNote':
    'Hali ya mfano: kuunganisha hutumia data ya benki ya kuigiza. Weka EXPO_PUBLIC_DATA_SOURCE=plaid na uunganishe seva yako ili kuunganisha akaunti halisi.',
  'link.link': 'Unganisha →',

  'modal.transaction': 'Muamala',
  'modal.linkBank': 'Unganisha benki',
  'modal.budget': 'Bajeti',
  'modal.goal': 'Lengo',
  'modal.categories': 'Kategoria',
  'modal.category': 'Kategoria',

  'settings.categories': 'Kategoria',
  'categories.title': 'Kategoria',
  'category.name': 'Jina',
  'category.namePlaceholder': 'mf. Kahawa',
  'category.kind': 'Aina',
  'category.icon': 'Ikoni',
  'category.color': 'Rangi',
  'category.createBtn': 'Tengeneza kategoria',
  'category.saveBtn': 'Hifadhi kategoria',
  'category.deleteBtn': 'Futa kategoria',
  'category.inUse': 'Inatumiwa na vitu {count}. Vitaendelea kuitumia, lakini haitachaguliwa.',
  'category.reorderHint': 'Shikilia na buruta kupanga upya.',
  'category.merge': 'Unganisha na kategoria nyingine',
  'category.mergeTitle': 'Unganisha “{name}” na',
  'category.mergeConfirm': 'Hamisha vitu {count} kwenda “{target}” na uondoe “{name}”?',

  'modal.account': 'Akaunti',
  'account.add': '+ Ongeza akaunti',
  'account.name': 'Jina',
  'account.namePlaceholder': 'mf. Ya kila siku',
  'account.institution': 'Taasisi',
  'account.institutionPlaceholder': 'mf. CRDB Bank',
  'account.type': 'Aina',
  'account.balance': 'Salio',
  'account.currency': 'Sarafu',
  'account.createBtn': 'Ongeza akaunti',
  'account.saveBtn': 'Hifadhi akaunti',
  'account.deleteBtn': 'Futa akaunti',
  'account.deleteConfirm': 'Futa akaunti hii na miamala yake {count}?',
  'accountType.checking': 'Malipo',
  'accountType.savings': 'Akiba',
  'accountType.credit': 'Mkopo',
  'accountType.cash': 'Taslimu',
  'accountType.investment': 'Uwekezaji',
};

export const catalogs = { en, sw };

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

/**
 * Pure translator: no React or store dependency, so it is trivially testable.
 * Falls back to English, then to the raw key.
 */
export function translate(lang: keyof typeof catalogs, key: TKey, vars?: Vars): string {
  const dict = catalogs[lang] ?? en;
  const template = dict[key] ?? en[key] ?? key;
  return interpolate(template, vars);
}
