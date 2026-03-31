import { faker } from '@faker-js/faker';

export const TEST_FIRST_NAME = `Test ${faker.person.firstName()}`;

export const TEST_LAST_NAME = faker.person.lastName();

export const TEST_CITY = faker.location.city();

export const TEST_STREET = faker.location.street();

export const TEST_IP = '127.0.0.1'; // This is in allowedIPs

export const TEST_EMAIL = faker.internet.email();

export const TEST_PHONE = faker.phone.number();

export const TEST_MOBILE = faker.phone.number();
