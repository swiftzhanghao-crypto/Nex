import { join } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';

const testDir = mkdtempSync(join(tmpdir(), 'nex-test-'));
process.env.DB_PATH = join(testDir, 'test.db');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars-long';
process.env.LOG_LEVEL = 'error';
