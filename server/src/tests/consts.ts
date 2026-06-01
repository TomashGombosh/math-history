import { faker } from '@faker-js/faker';

// Isolated cohort years for integration tests (graduates module tests).
export const TEST_GRADUATE_YEAR_CREATE = 2094;
export const TEST_GRADUATE_YEAR_UPDATE = 2095;
export const TEST_GRADUATE_YEAR_DELETE = 2096;

/** Year with no cohorts — public GET detail smoke test. */
export const TEST_GRADUATE_YEAR_EMPTY = 1888;

export const TEST_FIRST_NAME = `Test ${faker.person.firstName()}`;

export const TEST_LAST_NAME = faker.person.lastName();

export const TEST_CITY = faker.location.city();

export const TEST_STREET = faker.location.street();

export const TEST_IP = '127.0.0.1'; // This is in allowedIPs

export const TEST_EMAIL = faker.internet.email();

export const TEST_PHONE = faker.phone.number();

export const TEST_MOBILE = faker.phone.number();
