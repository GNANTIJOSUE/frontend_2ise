#!/usr/bin/env node

/**
 * Script to check for useEffect hooks that might need cleanup functions
 * Run with: node scripts/check-useEffect-cleanup.js
 */

const fs = require('fs');
const path = require('path');

// Components that have been fixed
const FIXED_COMPONENTS = [
    'StudentDashboard.tsx',
    'StudentPaymentPage.tsx',
    'StudentSchedule.tsx',
    'StudentTimetablePage.tsx',
    'StudentReportCard.tsx',
    'StudentPaymentReturn.tsx',
    'MyReportCard.tsx',
    'TeacherDashboard.tsx',
    'Students.tsx',
    'StudentDetails.tsx',
    'PublicEventPage.tsx'
];

// Components that need verification
const NEEDS_VERIFICATION = [
    'ReportCardsClasses.tsx',
    'ReportCardsStudents.tsx',
    'Classes.tsx',
    'Teachers.tsx',
    'Subjects.tsx',
    'PrivateEventPage.tsx',
    'ClassEventSelectionPage.tsx',
    'ClassEventCreationPage.tsx',
    'ClassTimetablePage.tsx',
    'TimetableSelectionPage.tsx',
    'InscrptionPre.tsx',
    'GestionEleves.tsx',
    'FinalizeRegistration.tsx',
    'ClassesScheduleList.tsx'
];

function checkUseEffectCleanup(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const issues = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('useEffect(') && !line.includes('return () =>')) {
                // Check if there's a cleanup function in the next few lines
                let hasCleanup = false;
                for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
                    if (lines[j].includes('return () =>')) {
                        hasCleanup = true;
                        break;
                    }
                    if (lines[j].includes('}, [')) break; // End of useEffect
                }

                if (!hasCleanup) {
                    issues.push(`Line ${i + 1}: ${line.trim()}`);
                }
            }
        }

        return issues;
    } catch (error) {
        return [`Error reading file: ${error.message}`];
    }
}

function scanDirectory(dir, fileExtensions = ['.tsx', '.ts']) {
    const results = [];

    function scan(currentDir) {
        const files = fs.readdirSync(currentDir);

        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                scan(filePath);
            } else if (fileExtensions.some(ext => file.endsWith(ext))) {
                results.push(filePath);
            }
        }
    }

    scan(dir);
    return results;
}

function main() {
    console.log('🔍 Checking for useEffect hooks that need cleanup...\n');

    const srcDir = path.join(__dirname, '..', 'src');
    const files = scanDirectory(srcDir);

    let totalIssues = 0;
    const componentIssues = {};

    for (const file of files) {
        const fileName = path.basename(file);
        const issues = checkUseEffectCleanup(file);

        if (issues.length > 0) {
            componentIssues[fileName] = issues;
            totalIssues += issues.length;
        }
    }

    // Display results
    console.log('📊 Results:\n');

    if (totalIssues === 0) {
        console.log('✅ All useEffect hooks have proper cleanup functions!');
    } else {
        console.log(`⚠️  Found ${totalIssues} useEffect hooks that might need cleanup:\n`);

        for (const [fileName, issues] of Object.entries(componentIssues)) {
            const status = FIXED_COMPONENTS.includes(fileName) ? '✅ FIXED' :
                NEEDS_VERIFICATION.includes(fileName) ? '🔍 NEEDS VERIFICATION' : '❌ NOT FIXED';

            console.log(`${status} ${fileName}:`);
            issues.forEach(issue => console.log(`  ${issue}`));
            console.log('');
        }
    }

    // Summary
    console.log('📋 Summary:');
    console.log(`- Fixed components: ${FIXED_COMPONENTS.length}`);
    console.log(`- Needs verification: ${NEEDS_VERIFICATION.length}`);
    console.log(`- Total issues found: ${totalIssues}`);

    if (totalIssues > 0) {
        console.log('\n💡 Recommendations:');
        console.log('1. Check the components marked as "NEEDS VERIFICATION"');
        console.log('2. Add proper cleanup functions to useEffect hooks');
        console.log('3. Test navigation between pages to ensure no DOM errors');
        console.log('4. Use the TestComponent to verify fixes');
    }
}

if (require.main === module) {
    main();
}

module.exports = { checkUseEffectCleanup, scanDirectory };