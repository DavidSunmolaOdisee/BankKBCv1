CREATE DATABASE IF NOT EXISTS `pingfindb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pingfindb`;

/* ============================================================
   PingFin - Complete Regular Bank Database
   MySQL compatible SQL
   ============================================================ */

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS `v_outstanding_payments`;
DROP VIEW IF EXISTS `v_failed_payments`;
DROP VIEW IF EXISTS `v_account_balances`;

DROP TABLE IF EXISTS `ACK_OUT`;
DROP TABLE IF EXISTS `ACK_IN`;
DROP TABLE IF EXISTS `PO_IN`;
DROP TABLE IF EXISTS `PO_OUT`;
DROP TABLE IF EXISTS `PO_NEW`;
DROP TABLE IF EXISTS `TRANSACTIONS`;
DROP TABLE IF EXISTS `LOG`;
DROP TABLE IF EXISTS `ACCOUNTS`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `ACCOUNTS` (
    `id` VARCHAR(34) NOT NULL,
    `account_name` VARCHAR(100) NULL,
    `balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `CK_ACCOUNTS_balance_nonnegative` CHECK (`balance` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `TRANSACTIONS` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(12,2) NOT NULL,
    `datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `po_id` VARCHAR(50) NOT NULL,
    `account_id` VARCHAR(34) NULL,
    `isvalid` TINYINT(1) NOT NULL DEFAULT 0,
    `iscomplete` TINYINT(1) NOT NULL DEFAULT 0,
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_TRANSACTIONS_ACCOUNTS`
        FOREIGN KEY (`account_id`) REFERENCES `ACCOUNTS`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `LOG` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `message` VARCHAR(500) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `po_id` VARCHAR(50) NULL,
    `po_amount` DECIMAL(12,2) NULL,
    `po_message` VARCHAR(255) NULL,
    `po_datetime` DATETIME NULL,
    `ob_id` VARCHAR(11) NULL,
    `oa_id` VARCHAR(34) NULL,
    `ob_code` VARCHAR(20) NULL,
    `ob_datetime` DATETIME NULL,
    `cb_code` VARCHAR(20) NULL,
    `cb_datetime` DATETIME NULL,
    `bb_id` VARCHAR(11) NULL,
    `ba_id` VARCHAR(34) NULL,
    `bb_code` VARCHAR(20) NULL,
    `bb_datetime` DATETIME NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `PO_NEW` (
    `po_id` VARCHAR(50) NOT NULL,
    `po_amount` DECIMAL(12,2) NOT NULL,
    `po_message` VARCHAR(255) NOT NULL,
    `po_datetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ob_id` VARCHAR(11) NOT NULL,
    `oa_id` VARCHAR(34) NOT NULL,
    `ob_code` VARCHAR(20) NULL,
    `ob_datetime` DATETIME NULL,
    `cb_code` VARCHAR(20) NULL,
    `cb_datetime` DATETIME NULL,
    `bb_id` VARCHAR(11) NOT NULL,
    `ba_id` VARCHAR(34) NOT NULL,
    `bb_code` VARCHAR(20) NULL,
    `bb_datetime` DATETIME NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'NEW',
    `error_code` VARCHAR(20) NULL,
    `error_description` VARCHAR(255) NULL,
    PRIMARY KEY (`po_id`),
    CONSTRAINT `CK_PO_NEW_amount_positive` CHECK (`po_amount` > 0),
    CONSTRAINT `CK_PO_NEW_amount_max` CHECK (`po_amount` <= 500),
    CONSTRAINT `CK_PO_NEW_amount_2dec` CHECK (`po_amount` = ROUND(`po_amount`, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `PO_OUT` (
    `po_id` VARCHAR(50) NOT NULL,
    `po_amount` DECIMAL(12,2) NOT NULL,
    `po_message` VARCHAR(255) NOT NULL,
    `po_datetime` DATETIME NOT NULL,
    `ob_id` VARCHAR(11) NOT NULL,
    `oa_id` VARCHAR(34) NOT NULL,
    `ob_code` VARCHAR(20) NULL,
    `ob_datetime` DATETIME NULL,
    `cb_code` VARCHAR(20) NULL,
    `cb_datetime` DATETIME NULL,
    `bb_id` VARCHAR(11) NOT NULL,
    `ba_id` VARCHAR(34) NOT NULL,
    `bb_code` VARCHAR(20) NULL,
    `bb_datetime` DATETIME NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'READY_TO_SEND',
    `sent_at` DATETIME NULL,
    PRIMARY KEY (`po_id`),
    CONSTRAINT `CK_PO_OUT_amount_positive` CHECK (`po_amount` > 0),
    CONSTRAINT `CK_PO_OUT_amount_max` CHECK (`po_amount` <= 500),
    CONSTRAINT `CK_PO_OUT_amount_2dec` CHECK (`po_amount` = ROUND(`po_amount`, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `PO_IN` (
    `po_id` VARCHAR(50) NOT NULL,
    `po_amount` DECIMAL(12,2) NOT NULL,
    `po_message` VARCHAR(255) NOT NULL,
    `po_datetime` DATETIME NOT NULL,
    `ob_id` VARCHAR(11) NOT NULL,
    `oa_id` VARCHAR(34) NOT NULL,
    `ob_code` VARCHAR(20) NULL,
    `ob_datetime` DATETIME NULL,
    `cb_code` VARCHAR(20) NULL,
    `cb_datetime` DATETIME NULL,
    `bb_id` VARCHAR(11) NOT NULL,
    `ba_id` VARCHAR(34) NOT NULL,
    `bb_code` VARCHAR(20) NULL,
    `bb_datetime` DATETIME NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
    `received_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`po_id`),
    CONSTRAINT `CK_PO_IN_amount_positive` CHECK (`po_amount` > 0),
    CONSTRAINT `CK_PO_IN_amount_max` CHECK (`po_amount` <= 500),
    CONSTRAINT `CK_PO_IN_amount_2dec` CHECK (`po_amount` = ROUND(`po_amount`, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ACK_IN` (
    `po_id` VARCHAR(50) NOT NULL,
    `po_amount` DECIMAL(12,2) NOT NULL,
    `po_message` VARCHAR(255) NOT NULL,
    `po_datetime` DATETIME NOT NULL,
    `ob_id` VARCHAR(11) NOT NULL,
    `oa_id` VARCHAR(34) NOT NULL,
    `ob_code` VARCHAR(20) NULL,
    `ob_datetime` DATETIME NULL,
    `cb_code` VARCHAR(20) NULL,
    `cb_datetime` DATETIME NULL,
    `bb_id` VARCHAR(11) NOT NULL,
    `ba_id` VARCHAR(34) NOT NULL,
    `bb_code` VARCHAR(20) NULL,
    `bb_datetime` DATETIME NULL,
    `ack_status` VARCHAR(30) NOT NULL,
    `error_code` VARCHAR(20) NULL,
    `error_description` VARCHAR(255) NULL,
    `received_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`po_id`),
    CONSTRAINT `CK_ACK_IN_status` CHECK (`ack_status` IN ('SUCCESS', 'FAILED', 'TIMEOUT', 'PENDING'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ACK_OUT` (
    `po_id` VARCHAR(50) NOT NULL,
    `po_amount` DECIMAL(12,2) NOT NULL,
    `po_message` VARCHAR(255) NOT NULL,
    `po_datetime` DATETIME NOT NULL,
    `ob_id` VARCHAR(11) NOT NULL,
    `oa_id` VARCHAR(34) NOT NULL,
    `ob_code` VARCHAR(20) NULL,
    `ob_datetime` DATETIME NULL,
    `cb_code` VARCHAR(20) NULL,
    `cb_datetime` DATETIME NULL,
    `bb_id` VARCHAR(11) NOT NULL,
    `ba_id` VARCHAR(34) NOT NULL,
    `bb_code` VARCHAR(20) NULL,
    `bb_datetime` DATETIME NULL,
    `ack_status` VARCHAR(30) NOT NULL,
    `error_code` VARCHAR(20) NULL,
    `error_description` VARCHAR(255) NULL,
    `sent_at` DATETIME NULL,
    PRIMARY KEY (`po_id`),
    CONSTRAINT `CK_ACK_OUT_status` CHECK (`ack_status` IN ('SUCCESS', 'FAILED', 'PENDING'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `ACCOUNTS` (`id`, `account_name`, `balance`) VALUES
('BE64096123456701', 'Test Account 01', 5000.00),
('BE37096123456702', 'Test Account 02', 5000.00),
('BE10096123456703', 'Test Account 03', 5000.00),
('BE80096123456704', 'Test Account 04', 5000.00),
('BE53096123456705', 'Test Account 05', 5000.00),
('BE26096123456706', 'Test Account 06', 5000.00),
('BE96096123456707', 'Test Account 07', 5000.00),
('BE69096123456708', 'Test Account 08', 5000.00),
('BE42096123456709', 'Test Account 09', 5000.00),
('BE15096123456710', 'Test Account 10', 5000.00),
('BE85096123456711', 'Test Account 11', 5000.00),
('BE58096123456712', 'Test Account 12', 5000.00),
('BE31096123456713', 'Test Account 13', 5000.00),
('BE04096123456714', 'Test Account 14', 5000.00),
('BE74096123456715', 'Test Account 15', 5000.00),
('BE47096123456716', 'Test Account 16', 5000.00),
('BE20096123456717', 'Test Account 17', 5000.00),
('BE90096123456718', 'Test Account 18', 5000.00),
('BE63096123456719', 'Test Account 19', 5000.00),
('BE36096123456720', 'Test Account 20', 5000.00);

INSERT INTO `PO_NEW` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `status`, `error_code`, `error_description`
) VALUES
('BARCBEBB_001', 120.00, 'Test run - UC1 unknown OA', CURRENT_TIMESTAMP,
 'BARCBEBB', 'BE00000000000000', NULL, NULL, NULL, NULL,
 'DEGRBEBB', 'BE64096123456701', NULL, NULL,
 'FAILED', 'OB_404_OA', 'Originator account does not exist'),

('BARCBEBB_002', 50.00, 'Test run - UC2 internal payment', CURRENT_TIMESTAMP,
 'BARCBEBB', 'BE64096123456701', '2000', CURRENT_TIMESTAMP, NULL, NULL,
 'BARCBEBB', 'BE37096123456702', NULL, NULL,
 'PROCESSED_INTERNAL', NULL, NULL),

('BARCBEBB_003', 75.00, 'Test run - UC3 unknown BB', CURRENT_TIMESTAMP,
 'BARCBEBB', 'BE10096123456703', '2000', CURRENT_TIMESTAMP, NULL, NULL,
 'XXXXBE99', 'BE80096123456704', NULL, NULL,
 'SENT_TO_CB', NULL, NULL),

('BARCBEBB_004', 100.00, 'Test run - UC4 unknown BA at BB', CURRENT_TIMESTAMP,
 'BARCBEBB', 'BE53096123456705', '2000', CURRENT_TIMESTAMP, NULL, NULL,
 'DEGRBEBB', 'BE00000000000000', NULL, NULL,
 'SENT_TO_CB', NULL, NULL),

('BARCBEBB_005', 125.00, 'Test run - UC5 success', CURRENT_TIMESTAMP,
 'BARCBEBB', 'BE26096123456706', '2000', CURRENT_TIMESTAMP, NULL, NULL,
 'DEGRBEBB', 'BE96096123456707', NULL, NULL,
 'SENT_TO_CB', NULL, NULL);

INSERT INTO `PO_OUT` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `status`, `sent_at`
)
SELECT
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    'SENT', CURRENT_TIMESTAMP
FROM `PO_NEW`
WHERE `po_id` IN ('BARCBEBB_003', 'BARCBEBB_004', 'BARCBEBB_005');

INSERT INTO `ACK_IN` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `ack_status`, `error_code`, `error_description`, `received_at`
)
SELECT
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    '4004', CURRENT_TIMESTAMP,
    `bb_id`, `ba_id`, NULL, NULL,
    'FAILED', '4004', 'bb_id does not exist in the Clearing Bank system', CURRENT_TIMESTAMP
FROM `PO_NEW`
WHERE `po_id` = 'BARCBEBB_003';

INSERT INTO `ACK_IN` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `ack_status`, `error_code`, `error_description`, `received_at`
)
SELECT
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    '2000', CURRENT_TIMESTAMP,
    `bb_id`, `ba_id`, 'BB_404_BA', CURRENT_TIMESTAMP,
    'FAILED', 'BB_404_BA', 'Beneficiary account does not exist', CURRENT_TIMESTAMP
FROM `PO_NEW`
WHERE `po_id` = 'BARCBEBB_004';

INSERT INTO `ACK_IN` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `ack_status`, `error_code`, `error_description`, `received_at`
)
SELECT
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    '2000', CURRENT_TIMESTAMP,
    `bb_id`, `ba_id`, '2000', CURRENT_TIMESTAMP,
    'SUCCESS', NULL, NULL, CURRENT_TIMESTAMP
FROM `PO_NEW`
WHERE `po_id` = 'BARCBEBB_005';

INSERT INTO `PO_IN` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `status`, `received_at`
) VALUES
('DEGRBEBB_104', 100.00, 'Incoming test - UC4 unknown BA at this BB', CURRENT_TIMESTAMP,
 'DEGRBEBB', 'BE69096123456708', '2000', CURRENT_TIMESTAMP,
 '2000', CURRENT_TIMESTAMP,
 'BARCBEBB', 'BE00000000000000', NULL, NULL,
 'RECEIVED', CURRENT_TIMESTAMP),

('DEGRBEBB_105', 90.00, 'Incoming test - successful payment to this BB', CURRENT_TIMESTAMP,
 'DEGRBEBB', 'BE42096123456709', '2000', CURRENT_TIMESTAMP,
 '2000', CURRENT_TIMESTAMP,
 'BARCBEBB', 'BE15096123456710', NULL, NULL,
 'RECEIVED', CURRENT_TIMESTAMP);

INSERT INTO `ACK_OUT` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `ack_status`, `error_code`, `error_description`, `sent_at`
)
SELECT
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, 'BB_404_BA', CURRENT_TIMESTAMP,
    'FAILED', 'BB_404_BA', 'Beneficiary account does not exist', CURRENT_TIMESTAMP
FROM `PO_IN`
WHERE `po_id` = 'DEGRBEBB_104';

INSERT INTO `ACK_OUT` (
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`,
    `ack_status`, `error_code`, `error_description`, `sent_at`
)
SELECT
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, '2000', CURRENT_TIMESTAMP,
    'SUCCESS', NULL, NULL, CURRENT_TIMESTAMP
FROM `PO_IN`
WHERE `po_id` = 'DEGRBEBB_105';

INSERT INTO `TRANSACTIONS` (`amount`, `datetime`, `po_id`, `account_id`, `isvalid`, `iscomplete`, `description`)
VALUES (0.00, CURRENT_TIMESTAMP, 'BARCBEBB_001', NULL, 0, 1, 'Failed at OB validation: unknown OA');

INSERT INTO `TRANSACTIONS` (`amount`, `datetime`, `po_id`, `account_id`, `isvalid`, `iscomplete`, `description`)
VALUES
(-50.00, CURRENT_TIMESTAMP, 'BARCBEBB_002', 'BE64096123456701', 1, 1, 'Internal payment debit OA'),
( 50.00, CURRENT_TIMESTAMP, 'BARCBEBB_002', 'BE37096123456702', 1, 1, 'Internal payment credit BA');

UPDATE `ACCOUNTS` SET `balance` = `balance` - 50.00 WHERE `id` = 'BE64096123456701';
UPDATE `ACCOUNTS` SET `balance` = `balance` + 50.00 WHERE `id` = 'BE37096123456702';

INSERT INTO `TRANSACTIONS` (`amount`, `datetime`, `po_id`, `account_id`, `isvalid`, `iscomplete`, `description`)
VALUES (0.00, CURRENT_TIMESTAMP, 'BARCBEBB_003', 'BE10096123456703', 0, 1, 'Failed at CB validation: unknown BB');

INSERT INTO `TRANSACTIONS` (`amount`, `datetime`, `po_id`, `account_id`, `isvalid`, `iscomplete`, `description`)
VALUES (0.00, CURRENT_TIMESTAMP, 'BARCBEBB_004', 'BE53096123456705', 0, 1, 'Failed at BB validation: unknown BA');

INSERT INTO `TRANSACTIONS` (`amount`, `datetime`, `po_id`, `account_id`, `isvalid`, `iscomplete`, `description`)
VALUES (-125.00, CURRENT_TIMESTAMP, 'BARCBEBB_005', 'BE26096123456706', 1, 1, 'External payment debit OA after positive ACK');

UPDATE `ACCOUNTS` SET `balance` = `balance` - 125.00 WHERE `id` = 'BE26096123456706';

INSERT INTO `TRANSACTIONS` (`amount`, `datetime`, `po_id`, `account_id`, `isvalid`, `iscomplete`, `description`)
VALUES (90.00, CURRENT_TIMESTAMP, 'DEGRBEBB_105', 'BE15096123456710', 1, 1, 'Incoming external payment credit BA');

UPDATE `ACCOUNTS` SET `balance` = `balance` + 90.00 WHERE `id` = 'BE15096123456710';

INSERT INTO `LOG` (
    `message`, `type`, `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
)
SELECT
    CONCAT('PO_NEW created/processed: ', `po_id`),
    'po_new',
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
FROM `PO_NEW`;

INSERT INTO `LOG` (
    `message`, `type`, `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
)
SELECT
    CONCAT('PO_OUT sent to Clearing Bank: ', `po_id`),
    'po_out',
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
FROM `PO_OUT`;

INSERT INTO `LOG` (
    `message`, `type`, `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
)
SELECT
    CONCAT('PO_IN received from Clearing Bank: ', `po_id`),
    'po_in',
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
FROM `PO_IN`;

INSERT INTO `LOG` (
    `message`, `type`, `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
)
SELECT
    CONCAT('ACK_IN received: ', `po_id`, ' status=', `ack_status`),
    'ack_in',
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
FROM `ACK_IN`;

INSERT INTO `LOG` (
    `message`, `type`, `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
)
SELECT
    CONCAT('ACK_OUT sent: ', `po_id`, ' status=', `ack_status`),
    'ack_out',
    `po_id`, `po_amount`, `po_message`, `po_datetime`,
    `ob_id`, `oa_id`, `ob_code`, `ob_datetime`,
    `cb_code`, `cb_datetime`,
    `bb_id`, `ba_id`, `bb_code`, `bb_datetime`
FROM `ACK_OUT`;

-- Mark seeded incoming PO_IN examples as already handled, so /api/po_in_process/ does not process demo data twice.
UPDATE `PO_IN` SET `status` = 'FAILED', `bb_code` = 'BB_404_BA', `bb_datetime` = CURRENT_TIMESTAMP WHERE `po_id` = 'DEGRBEBB_104';
UPDATE `PO_IN` SET `status` = 'PROCESSED', `bb_code` = '2000', `bb_datetime` = CURRENT_TIMESTAMP WHERE `po_id` = 'DEGRBEBB_105';

CREATE VIEW `v_outstanding_payments` AS
SELECT
    po.`po_id`,
    po.`po_amount`,
    po.`po_message`,
    po.`po_datetime`,
    po.`oa_id`,
    po.`bb_id`,
    po.`ba_id`,
    po.`status`
FROM `PO_OUT` po
LEFT JOIN `ACK_IN` ack ON ack.`po_id` = po.`po_id`
WHERE ack.`po_id` IS NULL;

CREATE VIEW `v_failed_payments` AS
SELECT `po_id`, `po_amount`, `po_message`, `status`, `error_code`, `error_description`
FROM `PO_NEW`
WHERE `status` = 'FAILED'
   OR `error_code` IS NOT NULL

UNION ALL

SELECT `po_id`, `po_amount`, `po_message`, `ack_status` AS `status`, `error_code`, `error_description`
FROM `ACK_IN`
WHERE `ack_status` = 'FAILED'

UNION ALL

SELECT `po_id`, `po_amount`, `po_message`, `ack_status` AS `status`, `error_code`, `error_description`
FROM `ACK_OUT`
WHERE `ack_status` = 'FAILED';

CREATE VIEW `v_account_balances` AS
SELECT `id`, `account_name`, `balance`
FROM `ACCOUNTS`;

SELECT COUNT(*) AS `account_count` FROM `ACCOUNTS`;
SELECT * FROM `ACCOUNTS`;
SELECT * FROM `PO_NEW`;
SELECT * FROM `PO_OUT`;
SELECT * FROM `PO_IN`;
SELECT * FROM `ACK_IN`;
SELECT * FROM `ACK_OUT`;
SELECT * FROM `TRANSACTIONS`;
SELECT * FROM `LOG`;
SELECT * FROM `v_outstanding_payments`;
SELECT * FROM `v_failed_payments`;
