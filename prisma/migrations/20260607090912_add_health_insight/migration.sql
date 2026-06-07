-- CreateTable
CREATE TABLE "HealthInsight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userEmail" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "weeklyRead" TEXT NOT NULL,
    "priorities" TEXT NOT NULL,
    "todayAction" TEXT NOT NULL,
    "workoutFocus" TEXT NOT NULL,
    "entryCount" INTEGER NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
