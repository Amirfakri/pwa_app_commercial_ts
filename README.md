pwa_app_commercial_ts/
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── docker-compose.yml
├── tsconfig.base.json
│
├── backend/
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       │
│       ├── core/
│       │   ├── index.ts
│       │   │
│       │   ├── config/
│       │   │   └── index.ts
│       │   │
│       │   ├── database/
│       │   │   ├── postgres.ts
│       │   │   ├── redis.ts
│       │   │   └── init.sql
│       │   │
│       │   ├── logger/
│       │   │   └── winston.ts
│       │   │
│       │   ├── cache/
│       │   │   └── cacheManager.ts
│       │   │
│       │   ├── security/
│       │   │   ├── rateLimiter.ts
│       │   │   ├── tokenBlacklist.ts
│       │   │   ├── helmet.ts
│       │   │   └── cors.ts
│       │   │
│       │   ├── queue/
│       │   │   └── queueManager.ts
│       │   │
│       │   ├── exceptions/
│       │   │   ├── AppError.ts
│       │   │   ├── NotFoundError.ts
│       │   │   ├── UnauthorizedError.ts
│       │   │   ├── ForbiddenError.ts
│       │   │   └── ValidationError.ts
│       │   │
│       │   └── middleware/
│       │       ├── errorHandler.ts
│       │       ├── requestLogger.ts
│       │       └── validationHandler.ts
│       │
│       ├── modules/
│       │   │
│       │   ├── auth/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   └── auth.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   └── auth.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── session.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   ├── user.repository.ts
│       │   │   │   ├── session.repository.ts
│       │   │   │   └── admin.repository.ts
│       │   │   │
│       │   │   ├── middlewares/
│       │   │   │   └── auth.middleware.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   └── auth.validator.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── auth.types.ts
│       │   │
│       │   ├── admin/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   └── admin.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   └── admin.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   ├── admin.service.ts
│       │   │   │   └── user.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   └── session.repository.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   └── admin.validator.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── admin.types.ts
│       │   │
│       │   ├── transaction/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   └── transaction.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   └── transaction.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   ├── transaction.service.ts
│       │   │   │   └── timer.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   └── transaction.repository.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   └── transaction.validator.ts
│       │   │   │
│       │   │   ├── types/
│       │   │   │   └── transaction.types.ts
│       │   │   │
│       │   │   └── cron/
│       │   │       └── expiration.cron.ts
│       │   │
│       │   ├── price/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   └── price.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   └── price.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   ├── price.service.ts
│       │   │   │   ├── offset.service.ts
│       │   │   │   └── externalPrice.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   ├── price.repository.ts
│       │   │   │   ├── product.repository.ts
│       │   │   │   └── history.repository.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   └── price.validator.ts
│       │   │   │
│       │   │   ├── types/
│       │   │   │   └── price.types.ts
│       │   │   │
│       │   │   └── cron/
│       │   │       └── archive.cron.ts
│       │   │
│       │   ├── riz/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   └── riz.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   └── riz.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   ├── riz.service.ts
│       │   │   │   └── balance.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   └── riz.repository.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   └── riz.validator.ts
│       │   │   │
│       │   │   ├── types/
│       │   │   │   └── riz.types.ts
│       │   │   │
│       │   │   └── utils/
│       │   │       ├── dateFormatter.ts
│       │   │       └── numberFormatter.ts
│       │   │
│       │   ├── remittance/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   └── remittance.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   └── remittance.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── remittance.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   └── remittance.repository.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   └── remittance.validator.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── remittance.types.ts
│       │   │
│       │   ├── notification/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   ├── notification.routes.ts
│       │   │   │   ├── sms.routes.ts
│       │   │   │   └── dailyMessage.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   ├── notification.controller.ts
│       │   │   │   ├── sms.controller.ts
│       │   │   │   └── dailyMessage.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   ├── notification.service.ts
│       │   │   │   ├── sms.service.ts
│       │   │   │   ├── smsProvider.service.ts
│       │   │   │   └── dailyMessage.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   ├── notification.repository.ts
│       │   │   │   ├── sms.repository.ts
│       │   │   │   └── dailyMessage.repository.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   ├── notification.validator.ts
│       │   │   │   ├── sms.validator.ts
│       │   │   │   └── dailyMessage.validator.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── notification.types.ts
│       │   │
│       │   ├── terms/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── routes/
│       │   │   │   └── terms.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   └── terms.controller.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── terms.service.ts
│       │   │   │
│       │   │   ├── repositories/
│       │   │   │   └── terms.repository.ts
│       │   │   │
│       │   │   ├── validators/
│       │   │   │   └── terms.validator.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── terms.types.ts
│       │   │
│       │   └── backup/
│       │       ├── index.ts
│       │       │
│       │       ├── routes/
│       │       │   └── backup.routes.ts
│       │       │
│       │       ├── controllers/
│       │       │   └── backup.controller.ts
│       │       │
│       │       ├── services/
│       │       │   ├── backup.service.ts
│       │       │   └── excel.service.ts
│       │       │
│       │       ├── repositories/
│       │       │   └── backup.repository.ts
│       │       │
│       │       ├── validators/
│       │       │   └── backup.validator.ts
│       │       │
│       │       ├── types/
│       │       │   └── backup.types.ts
│       │       │
│       │       └── utils/
│       │           ├── dateFormatter.ts
│       │           └── numberFormatter.ts
│       │
│       └── database/
│           ├── init.sql
│           └── init.ts
│
├── frontend/
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── env.d.ts
│   │
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       │
│       ├── core/
│       │   ├── http/
│       │   │   ├── axios.ts
│       │   │   └── interceptors.ts
│       │   │
│       │   ├── router/
│       │   │   └── index.ts
│       │   │
│       │   ├── store/
│       │   │   └── index.ts
│       │   │
│       │   ├── socket/
│       │   │   └── socket.io.ts
│       │   │
│       │   └── config/
│       │       └── index.ts
│       │
│       ├── modules/
│       │   │
│       │   ├── auth/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── views/
│       │   │   │   ├── LoginView.vue
│       │   │   │   └── VerifyOtpView.vue
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── LoginForm.vue
│       │   │   │   └── OtpInput.vue
│       │   │   │
│       │   │   ├── stores/
│       │   │   │   └── authStore.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── authService.ts
│       │   │   │
│       │   │   ├── composables/
│       │   │   │   └── useAuth.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── auth.types.ts
│       │   │
│       │   ├── admin/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── views/
│       │   │   │   ├── UsersView.vue
│       │   │   │   ├── AdminsView.vue
│       │   │   │   ├── RegistrationsView.vue
│       │   │   │   └── AdminTransactionsView.vue
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── UserTable.vue
│       │   │   │   ├── UserForm.vue
│       │   │   │   └── AdminTable.vue
│       │   │   │
│       │   │   ├── stores/
│       │   │   │   └── adminStore.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── adminService.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── admin.types.ts
│       │   │
│       │   ├── dashboard/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── views/
│       │   │   │   └── DashboardView.vue
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── StatsCard.vue
│       │   │   │   ├── ChartWidget.vue
│       │   │   │   └── RecentTransactions.vue
│       │   │   │
│       │   │   ├── stores/
│       │   │   │   └── dashboardStore.ts
│       │   │   │
│       │   │   └── services/
│       │   │       └── dashboardService.ts
│       │   │
│       │   ├── transaction/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── views/
│       │   │   │   └── TransactionsView.vue
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── TransactionTable.vue
│       │   │   │   ├── TransactionCard.vue
│       │   │   │   └── TimerDisplay.vue
│       │   │   │
│       │   │   ├── stores/
│       │   │   │   └── transactionStore.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── transactionService.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── transaction.types.ts
│       │   │
│       │   ├── price/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── views/
│       │   │   │   ├── PricesView.vue
│       │   │   │   ├── PricesManagementView.vue
│       │   │   │   ├── ProductsView.vue
│       │   │   │   └── UserProductsView.vue
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── PriceTable.vue
│       │   │   │   ├── PriceCard.vue
│       │   │   │   └── ProductList.vue
│       │   │   │
│       │   │   ├── stores/
│       │   │   │   └── priceStore.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── priceService.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── price.types.ts
│       │   │
│       │   ├── riz/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── views/
│       │   │   │   └── BalanceView.vue
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── BalanceCard.vue
│       │   │   │   ├── TransactionTable.vue
│       │   │   │   └── UploadForm.vue
│       │   │   │
│       │   │   ├── stores/
│       │   │   │   └── rizStore.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── rizService.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── riz.types.ts
│       │   │
│       │   ├── remittance/
│       │   │   ├── index.ts
│       │   │   │
│       │   │   ├── views/
│       │   │   │   └── RemittancesView.vue
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── RemittanceTable.vue
│       │   │   │   └── RemittanceForm.vue
│       │   │   │
│       │   │   ├── stores/
│       │   │   │   └── remittanceStore.ts
│       │   │   │
│       │   │   ├── services/
│       │   │   │   └── remittanceService.ts
│       │   │   │
│       │   │   └── types/
│       │   │       └── remittance.types.ts
│       │   │
│       │   └── notification/
│       │       ├── index.ts
│       │       │
│       │       ├── views/
│       │       │   ├── NotificationsView.vue
│       │       │   └── DailyMessagesView.vue
│       │       │
│       │       ├── components/
│       │       │   ├── NotificationCard.vue
│       │       │   ├── NotificationForm.vue
│       │       │   └── SmsSender.vue
│       │       │
│       │       ├── stores/
│       │       │   └── notificationStore.ts
│       │       │
│       │       ├── services/
│       │       │   └── notificationService.ts
│       │       │
│       │       └── types/
│       │           └── notification.types.ts
│       │
│       ├── layouts/
│       │   ├── DefaultLayout.vue
│       │   ├── AdminLayout.vue
│       │   ├── AuthLayout.vue
│       │   └── PanelLayout.vue
│       │
│       ├── components/
│       │   ├── ui/
│       │   │   ├── AppButton.vue
│       │   │   ├── AppInput.vue
│       │   │   ├── AppModal.vue
│       │   │   ├── AppTable.vue
│       │   │   ├── AppCard.vue
│       │   │   ├── AppSpinner.vue
│       │   │   └── AppToast.vue
│       │   │
│       │   ├── layout/
│       │   │   ├── AppHeader.vue
│       │   │   ├── AppSidebar.vue
│       │   │   ├── AppFooter.vue
│       │   │   └── AppBreadcrumb.vue
│       │   │
│       │   └── shared/
│       │       ├── LoadingOverlay.vue
│       │       ├── ConfirmDialog.vue
│       │       ├── EmptyState.vue
│       │       └── ErrorBoundary.vue
│       │
│       ├── composables/
│       │   ├── useAuth.ts
│       │   ├── useApi.ts
│       │   ├── useSocket.ts
│       │   ├── useNotification.ts
│       │   ├── usePagination.ts
│       │   └── useForm.ts
│       │
│       ├── utils/
│       │   ├── formatters.ts
│       │   ├── validators.ts
│       │   ├── constants.ts
│       │   ├── helpers.ts
│       │   └── persianTools.ts
│       │
│       ├── types/
│       │   ├── global.d.ts
│       │   ├── api.types.ts
│       │   └── common.types.ts
│       │
│       ├── styles/
│       │   ├── main.css
│       │   ├── variables.css
│       │   ├── mixins.css
│       │   └── tailwind.css
│       │
│       └── assets/
│           ├── fonts/
│           ├── images/
│           └── icons/
│
├── shared/
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── price.types.ts
│   │   ├── transaction.types.ts
│   │   └── common.types.ts
│   │
│   └── utils/
│       ├── validators.ts
│       ├── formatters.ts
│       └── constants.ts
│
└── docs/
    ├── API.md
    ├── DATABASE.md
    └── DEPLOYMENT.md