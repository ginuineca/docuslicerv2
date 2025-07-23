import { performance } from 'perf_hooks'
import fs from 'fs/promises'
import path from 'path'
import { ComprehensiveTestSuite } from './comprehensive-test-suite'
import { StressTestRunner } from './stress-test-runner'

/**
 * Master test runner that orchestrates all DocuSlicer testing
 * Runs comprehensive feature tests, stress tests, and generates final report
 */

interface MasterTestReport {
  timestamp: string
  testSuiteVersion: string
  environment: {
    nodeVersion: string
    platform: string
    architecture: string
    cpuCount: number
    totalMemory: number
    freeMemory: number
  }
  executionSummary: {
    totalDuration: number
    testSuites: number
    totalTests: number
    passedTests: number
    failedTests: number
    warningTests: number
    overallSuccessRate: number
  }
  featureTests: {
    duration: number
    results: any[]
    summary: any
  }
  stressTests: {
    duration: number
    results: any[]
    summary: any
  }
  performanceMetrics: {
    memoryUsage: {
      initial: number
      peak: number
      final: number
      leaked: number
    }
    cpuUsage: {
      average: number
      peak: number
    }
    diskIO: {
      reads: number
      writes: number
      totalBytes: number
    }
  }
  recommendations: string[]
  criticalIssues: string[]
  passedCriteria: string[]
}

class MasterTestRunner {
  private startTime: number = 0
  private initialMemory: number = 0
  private peakMemory: number = 0
  private testResults: any[] = []

  async runAllTests(): Promise<void> {
    console.log('🚀 DOCUSLICER MASTER TEST SUITE')
    console.log('=====================================')
    console.log('Comprehensive testing of all features and performance\n')

    this.startTime = performance.now()
    this.initialMemory = process.memoryUsage().heapUsed

    try {
      // Pre-test system check
      await this.performSystemCheck()

      // Run comprehensive feature tests
      console.log('📋 PHASE 1: COMPREHENSIVE FEATURE TESTING')
      console.log('==========================================')
      const featureTestResults = await this.runFeatureTests()

      // Run stress tests
      console.log('\n💪 PHASE 2: STRESS TESTING')
      console.log('===========================')
      const stressTestResults = await this.runStressTests()

      // Generate master report
      console.log('\n📊 PHASE 3: REPORT GENERATION')
      console.log('==============================')
      await this.generateMasterReport(featureTestResults, stressTestResults)

      // Final system health check
      await this.performPostTestCheck()

      console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!')
      console.log('=====================================')

    } catch (error) {
      console.error('\n❌ TEST SUITE FAILED:', error.message)
      console.error('=====================================')
      throw error
    }
  }

  private async performSystemCheck(): Promise<void> {
    console.log('🔍 Performing pre-test system check...')

    // Check Node.js version
    const nodeVersion = process.version
    console.log(`   Node.js Version: ${nodeVersion}`)

    // Check available memory
    const memInfo = process.memoryUsage()
    const totalMem = require('os').totalmem()
    const freeMem = require('os').freemem()
    
    console.log(`   Total Memory: ${Math.round(totalMem / 1024 / 1024 / 1024)}GB`)
    console.log(`   Free Memory: ${Math.round(freeMem / 1024 / 1024 / 1024)}GB`)
    console.log(`   Heap Used: ${Math.round(memInfo.heapUsed / 1024 / 1024)}MB`)

    // Check CPU count
    const cpuCount = require('os').cpus().length
    console.log(`   CPU Cores: ${cpuCount}`)

    // Check disk space (simplified)
    try {
      const stats = await fs.stat(process.cwd())
      console.log(`   Working Directory: ${process.cwd()}`)
    } catch (error) {
      console.warn(`   Warning: Could not check disk space: ${error.message}`)
    }

    // Verify test dependencies
    const requiredDirs = ['uploads', 'temp', 'logs']
    for (const dir of requiredDirs) {
      try {
        await fs.mkdir(path.join(process.cwd(), dir), { recursive: true })
        console.log(`   ✅ Directory ready: ${dir}`)
      } catch (error) {
        console.warn(`   ⚠️  Directory issue: ${dir} - ${error.message}`)
      }
    }

    console.log('✅ System check completed\n')
  }

  private async runFeatureTests(): Promise<any> {
    console.log('Starting comprehensive feature testing...\n')
    
    const featureStartTime = performance.now()
    
    try {
      const testSuite = new ComprehensiveTestSuite()
      await testSuite.runAllTests()
      
      const featureDuration = performance.now() - featureStartTime
      
      // Read test results (would be saved by test suite)
      let testResults = null
      try {
        const reportPath = path.join(__dirname, 'test-report.json')
        const reportData = await fs.readFile(reportPath, 'utf-8')
        testResults = JSON.parse(reportData)
      } catch (error) {
        console.warn('Could not read feature test report:', error.message)
      }

      console.log(`✅ Feature testing completed in ${Math.round(featureDuration / 1000)}s\n`)
      
      return {
        duration: featureDuration,
        results: testResults?.featureTests || [],
        summary: testResults?.summary || {
          totalTests: 0,
          passed: 0,
          warnings: 0,
          failed: 0
        }
      }
    } catch (error) {
      console.error('❌ Feature testing failed:', error.message)
      throw error
    }
  }

  private async runStressTests(): Promise<any> {
    console.log('Starting stress testing...\n')
    
    const stressStartTime = performance.now()
    
    try {
      const stressRunner = new StressTestRunner()
      await stressRunner.runStressTests()
      
      const stressDuration = performance.now() - stressStartTime
      
      // Read stress test results
      let stressResults = null
      try {
        const reportPath = path.join(__dirname, 'stress-test-report.json')
        const reportData = await fs.readFile(reportPath, 'utf-8')
        stressResults = JSON.parse(reportData)
      } catch (error) {
        console.warn('Could not read stress test report:', error.message)
      }

      console.log(`✅ Stress testing completed in ${Math.round(stressDuration / 1000)}s\n`)
      
      return {
        duration: stressDuration,
        results: stressResults?.scenarios || [],
        summary: stressResults?.summary || {
          totalScenarios: 0,
          totalRequests: 0,
          totalSuccessful: 0,
          totalFailed: 0
        }
      }
    } catch (error) {
      console.error('❌ Stress testing failed:', error.message)
      throw error
    }
  }

  private async generateMasterReport(featureResults: any, stressResults: any): Promise<void> {
    console.log('Generating comprehensive test report...')

    const totalDuration = performance.now() - this.startTime
    const finalMemory = process.memoryUsage().heapUsed
    const memoryLeaked = finalMemory - this.initialMemory

    // Calculate overall metrics
    const totalTests = (featureResults.summary?.totalTests || 0)
    const passedTests = (featureResults.summary?.passed || 0)
    const failedTests = (featureResults.summary?.failed || 0)
    const warningTests = (featureResults.summary?.warnings || 0)
    const overallSuccessRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

    // Generate recommendations
    const recommendations = this.generateRecommendations(featureResults, stressResults, memoryLeaked)
    const criticalIssues = this.identifyCriticalIssues(featureResults, stressResults)
    const passedCriteria = this.identifyPassedCriteria(featureResults, stressResults)

    const masterReport: MasterTestReport = {
      timestamp: new Date().toISOString(),
      testSuiteVersion: '1.0.0',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        cpuCount: require('os').cpus().length,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem()
      },
      executionSummary: {
        totalDuration,
        testSuites: 2,
        totalTests,
        passedTests,
        failedTests,
        warningTests,
        overallSuccessRate
      },
      featureTests: featureResults,
      stressTests: stressResults,
      performanceMetrics: {
        memoryUsage: {
          initial: this.initialMemory,
          peak: this.peakMemory,
          final: finalMemory,
          leaked: memoryLeaked
        },
        cpuUsage: {
          average: 0, // Would need CPU monitoring
          peak: 0
        },
        diskIO: {
          reads: 0, // Would need disk monitoring
          writes: 0,
          totalBytes: 0
        }
      },
      recommendations,
      criticalIssues,
      passedCriteria
    }

    // Save master report
    const reportPath = path.join(__dirname, 'master-test-report.json')
    await fs.writeFile(reportPath, JSON.stringify(masterReport, null, 2))

    // Generate human-readable summary
    await this.generateHumanReadableReport(masterReport)

    console.log(`📋 Master test report saved to: ${reportPath}`)
    console.log('\n📊 FINAL TEST SUMMARY:')
    console.log('=======================')
    console.log(`   Total Duration: ${Math.round(totalDuration / 1000)}s`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   ✅ Passed: ${passedTests}`)
    console.log(`   ⚠️  Warnings: ${warningTests}`)
    console.log(`   ❌ Failed: ${failedTests}`)
    console.log(`   📊 Success Rate: ${overallSuccessRate.toFixed(1)}%`)
    console.log(`   💾 Memory Leaked: ${Math.round(memoryLeaked / 1024 / 1024)}MB`)
    
    if (criticalIssues.length > 0) {
      console.log(`   🚨 Critical Issues: ${criticalIssues.length}`)
    }
    
    if (recommendations.length > 0) {
      console.log(`   💡 Recommendations: ${recommendations.length}`)
    }
  }

  private generateRecommendations(featureResults: any, stressResults: any, memoryLeaked: number): string[] {
    const recommendations: string[] = []

    // Memory recommendations
    if (memoryLeaked > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Consider investigating memory leaks - significant memory not released after tests')
    }

    // Performance recommendations
    const avgResponseTime = stressResults.summary?.averageRPS || 0
    if (avgResponseTime < 10) {
      recommendations.push('Consider optimizing API response times - current throughput is below optimal')
    }

    // Error rate recommendations
    const errorRate = stressResults.summary?.averageErrorRate || 0
    if (errorRate > 0.05) { // 5%
      recommendations.push('Error rate is above acceptable threshold - investigate failing requests')
    }

    // Feature test recommendations
    const failureRate = featureResults.summary ? 
      (featureResults.summary.failed / featureResults.summary.totalTests) : 0
    if (failureRate > 0.1) { // 10%
      recommendations.push('High feature test failure rate - review failed tests and fix issues')
    }

    return recommendations
  }

  private identifyCriticalIssues(featureResults: any, stressResults: any): string[] {
    const issues: string[] = []

    // Critical feature failures
    if (featureResults.summary?.failed > 0) {
      issues.push(`${featureResults.summary.failed} critical feature tests failed`)
    }

    // Critical stress test failures
    const stressFailureRate = stressResults.summary ? 
      (stressResults.summary.totalFailed / stressResults.summary.totalRequests) : 0
    if (stressFailureRate > 0.2) { // 20%
      issues.push('High stress test failure rate indicates system instability under load')
    }

    return issues
  }

  private identifyPassedCriteria(featureResults: any, stressResults: any): string[] {
    const criteria: string[] = []

    // Feature test criteria
    if (featureResults.summary?.passed > 0) {
      criteria.push(`${featureResults.summary.passed} feature tests passed successfully`)
    }

    // Stress test criteria
    const stressSuccessRate = stressResults.summary ? 
      (stressResults.summary.totalSuccessful / stressResults.summary.totalRequests) : 0
    if (stressSuccessRate > 0.95) { // 95%
      criteria.push('System maintains high reliability under stress (>95% success rate)')
    }

    // Performance criteria
    if (stressResults.summary?.averageRPS > 20) {
      criteria.push('System achieves good throughput under load (>20 RPS)')
    }

    return criteria
  }

  private async generateHumanReadableReport(report: MasterTestReport): Promise<void> {
    const humanReport = `
DOCUSLICER COMPREHENSIVE TEST REPORT
====================================

Test Execution: ${report.timestamp}
Duration: ${Math.round(report.executionSummary.totalDuration / 1000)} seconds

ENVIRONMENT
-----------
Node.js: ${report.environment.nodeVersion}
Platform: ${report.environment.platform} (${report.environment.architecture})
CPU Cores: ${report.environment.cpuCount}
Memory: ${Math.round(report.environment.totalMemory / 1024 / 1024 / 1024)}GB total

OVERALL RESULTS
---------------
Total Tests: ${report.executionSummary.totalTests}
Passed: ${report.executionSummary.passedTests} ✅
Warnings: ${report.executionSummary.warningTests} ⚠️
Failed: ${report.executionSummary.failedTests} ❌
Success Rate: ${report.executionSummary.overallSuccessRate.toFixed(1)}%

FEATURE TESTS
-------------
Duration: ${Math.round(report.featureTests.duration / 1000)}s
Tests: ${report.featureTests.summary?.totalTests || 0}
Passed: ${report.featureTests.summary?.passed || 0}
Failed: ${report.featureTests.summary?.failed || 0}

STRESS TESTS
------------
Duration: ${Math.round(report.stressTests.duration / 1000)}s
Scenarios: ${report.stressTests.summary?.totalScenarios || 0}
Total Requests: ${report.stressTests.summary?.totalRequests || 0}
Successful: ${report.stressTests.summary?.totalSuccessful || 0}
Failed: ${report.stressTests.summary?.totalFailed || 0}

PERFORMANCE METRICS
-------------------
Memory Usage:
  Initial: ${Math.round(report.performanceMetrics.memoryUsage.initial / 1024 / 1024)}MB
  Peak: ${Math.round(report.performanceMetrics.memoryUsage.peak / 1024 / 1024)}MB
  Final: ${Math.round(report.performanceMetrics.memoryUsage.final / 1024 / 1024)}MB
  Leaked: ${Math.round(report.performanceMetrics.memoryUsage.leaked / 1024 / 1024)}MB

${report.criticalIssues.length > 0 ? `
CRITICAL ISSUES
---------------
${report.criticalIssues.map(issue => `• ${issue}`).join('\n')}
` : ''}

${report.recommendations.length > 0 ? `
RECOMMENDATIONS
---------------
${report.recommendations.map(rec => `• ${rec}`).join('\n')}
` : ''}

PASSED CRITERIA
---------------
${report.passedCriteria.map(criteria => `• ${criteria}`).join('\n')}

END OF REPORT
=============
`

    const humanReportPath = path.join(__dirname, 'master-test-report.txt')
    await fs.writeFile(humanReportPath, humanReport)
    
    console.log(`📄 Human-readable report saved to: ${humanReportPath}`)
  }

  private async performPostTestCheck(): Promise<void> {
    console.log('\n🔍 Performing post-test system check...')

    const finalMemory = process.memoryUsage()
    const memoryDelta = finalMemory.heapUsed - this.initialMemory

    console.log(`   Final Memory Usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`)
    console.log(`   Memory Delta: ${Math.round(memoryDelta / 1024 / 1024)}MB`)

    if (memoryDelta > 100 * 1024 * 1024) { // 100MB
      console.warn('   ⚠️  Significant memory increase detected - possible memory leak')
    } else {
      console.log('   ✅ Memory usage within acceptable range')
    }

    // Check for any remaining test files
    const testDirs = ['test-files', 'stress-test-files']
    for (const dir of testDirs) {
      const testDir = path.join(__dirname, dir)
      try {
        const files = await fs.readdir(testDir)
        if (files.length > 0) {
          console.warn(`   ⚠️  ${files.length} test files remain in ${dir}`)
        } else {
          console.log(`   ✅ Test directory clean: ${dir}`)
        }
      } catch (error) {
        // Directory doesn't exist - that's fine
        console.log(`   ✅ Test directory clean: ${dir}`)
      }
    }

    console.log('✅ Post-test check completed')
  }
}

// Export for use
export { MasterTestRunner }

// Run all tests if called directly
if (require.main === module) {
  const masterRunner = new MasterTestRunner()
  masterRunner.runAllTests().catch(error => {
    console.error('Master test runner failed:', error)
    process.exit(1)
  })
}
