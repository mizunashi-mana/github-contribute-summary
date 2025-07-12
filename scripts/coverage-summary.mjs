#!/usr/bin/env node

/**
 * coverage-final.jsonから全体のカバレッジ率を取得するスクリプト
 */

import fs from 'node:fs';
import path from 'node:path';

function getCoverageSummary() {
  const coverageFilePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');

  // coverage-final.jsonが存在するかチェック
  if (!fs.existsSync(coverageFilePath)) {
    console.error('❌ Coverage file not found. Please run tests with coverage first:');
    console.error('   npm run test:coverage');
    process.exit(1);
  }

  try {
    // coverage-final.jsonを読み込み
    const coverageData = JSON.parse(fs.readFileSync(coverageFilePath, 'utf8'));

    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;

    // 各ファイルのカバレッジデータを集計
    Object.entries(coverageData).forEach(([, data]) => {
      const { s, b, f } = data;

      // Statements
      const statements = Object.values(s);
      totalStatements += statements.length;
      coveredStatements += statements.filter(count => count > 0).length;

      // Branches
      const branches = Object.values(b).flat();
      totalBranches += branches.length;
      coveredBranches += branches.filter(count => count > 0).length;

      // Functions
      const functions = Object.values(f);
      totalFunctions += functions.length;
      coveredFunctions += functions.filter(count => count > 0).length;

      // Lines (statementsと同じ扱い)
      totalLines += statements.length;
      coveredLines += statements.filter(count => count > 0).length;
    });

    // カバレッジ率計算
    const statementCoverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
    const branchCoverage = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;
    const functionCoverage = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
    const lineCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

    // 結果を表示
    console.log('📊 Test Coverage Summary');
    console.log('========================');
    console.log(`📄 Statements: ${coveredStatements}/${totalStatements} (${statementCoverage.toFixed(2)}%)`);
    console.log(`🌿 Branches:   ${coveredBranches}/${totalBranches} (${branchCoverage.toFixed(2)}%)`);
    console.log(`🔧 Functions:  ${coveredFunctions}/${totalFunctions} (${functionCoverage.toFixed(2)}%)`);
    console.log(`📝 Lines:      ${coveredLines}/${totalLines} (${lineCoverage.toFixed(2)}%)`);
    console.log('========================');

    // 全体のカバレッジ率（平均）
    const overallCoverage = (statementCoverage + branchCoverage + functionCoverage + lineCoverage) / 4;
    console.log(`🎯 Overall Coverage: ${overallCoverage.toFixed(2)}%`);

    // コマンドライン引数の解析
    const args = process.argv.slice(2);
    const thresholdArg = args.find(arg => !arg.startsWith('--') && !isNaN(parseFloat(arg)));
    const threshold = thresholdArg ? parseFloat(thresholdArg) : null;
    const jsonOutput = args.includes('--json');

    // カバレッジしきい値チェック（オプション）
    if (threshold !== null) {
      console.log(`\n🎯 Threshold Check: ${threshold}%`);
      if (overallCoverage >= threshold) {
        console.log('✅ Coverage threshold met!');
        if (!jsonOutput) {
          process.exit(0);
        }
      }
      else {
        console.log(`❌ Coverage below threshold (${overallCoverage.toFixed(2)}% < ${threshold}%)`);
        if (!jsonOutput) {
          process.exit(1);
        }
      }
    }

    // JSON形式での出力（CI/CD用）
    if (jsonOutput) {
      const summary = {
        statements: { covered: coveredStatements, total: totalStatements, percentage: statementCoverage },
        branches: { covered: coveredBranches, total: totalBranches, percentage: branchCoverage },
        functions: { covered: coveredFunctions, total: totalFunctions, percentage: functionCoverage },
        lines: { covered: coveredLines, total: totalLines, percentage: lineCoverage },
        overall: overallCoverage,
      };
      console.log('\n📋 JSON Output:');
      console.log(JSON.stringify(summary, null, 2));
    }
  }
  catch (error) {
    console.error('❌ Error reading coverage file:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  getCoverageSummary();
}

export { getCoverageSummary };
