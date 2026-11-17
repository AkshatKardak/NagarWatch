const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  in: jest.fn().mockReturnThis(),
  join: jest.fn(),
};

jest.mock("@clerk/express", () => ({
  clerkMiddleware: () => (req: any, res: any, next: any) => next(),
  getAuth: (req: any) => {
    const header = req.headers ? req.headers["x-test-clerk-id"] : undefined;
    if (header === "none") return { userId: null };
    return { userId: header || "user_test_default_clerk" };
  },
}));

jest.mock("../../config/socket", () => ({
  initSocket: jest.fn(() => mockIo),
  getIO: jest.fn(() => mockIo),
}));

jest.mock("../../socket", () => ({
  getIO: jest.fn(() => mockIo),
  emitToUser: jest.fn(),
}));

jest.mock("../../config/cloudinary", () => ({
  uploadImage: jest.fn().mockResolvedValue("https://res.cloudinary.com/nagarwatch/image/upload/mock-proof.jpg"),
}));

jest.mock("../../jobs/slaQueue", () => ({
  addSLAJob: jest.fn().mockResolvedValue(undefined),
  slaQueue: null,
}));

jest.mock("../../config/redis", () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    isConnected: false,
  },
  bullRedis: null,
}));

jest.mock("../../services/emailService", () => ({
  sendResolutionEmail: jest.fn().mockResolvedValue(undefined),
  sendEscalationEmail: jest.fn().mockResolvedValue(undefined),
  sendSLAWarning: jest.fn().mockResolvedValue(undefined),
}));
