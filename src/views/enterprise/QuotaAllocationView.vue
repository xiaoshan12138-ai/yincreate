<template>
  <AppLayout>
    <div class="quota-page">
      <!-- 标签页导航 -->
      <div class="enterprise-tab-bar">
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['ent-tab', { active: activeTab === tab }]"
            @click="selectTab(tab)"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="quota-stats-grid">
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #eef2ff; color: #6366f1;">
            <i data-lucide="wallet" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">¥{{ (totalQuota / 10000).toFixed(1) }}万</span>
            <span class="stat-label">总额度池</span>
          </div>
        </div>
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #f0fdf4; color: #10b981;">
            <i data-lucide="check-circle-2" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">¥{{ (allocatedQuota / 10000).toFixed(1) }}万</span>
            <span class="stat-label">已分配</span>
          </div>
        </div>
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #fef3c7; color: #d97706;">
            <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">¥{{ ((totalQuota - allocatedQuota) / 10000).toFixed(1) }}万</span>
            <span class="stat-label">可分配</span>
          </div>
        </div>
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #fdf4ff; color: #a855f7;">
            <i data-lucide="users" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ accountList.length }}</span>
            <span class="stat-label">账号数量</span>
          </div>
        </div>
      </div>

      <!-- 额度分配操作栏 -->
      <ProjectHeaderBar
        title="额度分配"
        subtitle="为各账号分配使用额度，支持批量调整和按部门筛选"
        add-label="批量分配"
        @add="openBatchModal"
      >
        <template #extra>
          <!-- 分配模式切换 -->
          <div class="allocation-mode-switch">
            <span class="mode-label">分配方式：</span>
            <div class="mode-options">
              <button
                :class="['mode-btn', { active: allocationMode === 'unified' }]"
                @click="switchAllocationMode('unified')"
              >
                <i data-lucide="layers" style="width: 14px; height: 14px;"></i>
                统一分配
              </button>
              <button
                :class="['mode-btn', { active: allocationMode === 'hierarchical' }]"
                @click="switchAllocationMode('hierarchical')"
              >
                <i data-lucide="git-branch" style="width: 14px; height: 14px;"></i>
                逐级分配
              </button>
            </div>
          </div>

          <button class="save-quota-btn" :disabled="!hasChanges" @click="saveQuotaAllocations">
            <i data-lucide="save" style="width: 16px; height: 16px;"></i>
            保存分配
          </button>
        </template>
      </ProjectHeaderBar>

      <!-- 分配模式配置面板 -->
      <div class="allocation-config-panel" :class="`mode-${allocationMode}`">
        <!-- 统一分配模式 -->
        <div v-if="allocationMode === 'unified'" class="config-section unified-config">
          <h4 class="config-title">
            <i data-lucide="layers" style="width: 18px; height: 18px;"></i>
            统一分配设置
          </h4>
          <p class="config-desc">将总额度按照统一规则一次性分配给所有账号或指定部门</p>

          <div class="config-form">
            <div class="form-row-3col">
              <div class="form-field">
                <label class="field-label">分配范围</label>
                <select v-model="unifiedConfig.scope" class="field-select">
                  <option value="all">全部账号</option>
                  <option value="department">按部门分配</option>
                  <option value="selected">仅选中账号</option>
                </select>
              </div>
              <div class="form-field" v-if="unifiedConfig.scope === 'department'">
                <label class="field-label">目标部门</label>
                <select v-model="unifiedConfig.targetDepartment" class="field-select">
                  <option value="">请选择部门</option>
                  <option>公司</option>
                  <option>漫剧部</option>
                  <option>电商部</option>
                  <option>漫剧1组</option>
                  <option>漫剧2组</option>
                  <option>电商1组</option>
                </select>
              </div>
              <div class="form-field">
                <label class="field-label">分配方式</label>
                <select v-model="unifiedConfig.method" class="field-select">
                  <option value="equal">平均分配</option>
                  <option value="fixed">固定金额</option>
                  <option value="weight">按权重分配</option>
                  <option value="percent">按百分比</option>
                </select>
              </div>
            </div>

            <div class="form-row-3col" v-if="unifiedConfig.method !== 'equal'">
              <div class="form-field" v-if="unifiedConfig.method === 'fixed'">
                <label class="field-label">每账号金额（元）</label>
                <input type="number" v-model.number="unifiedConfig.fixedAmount" placeholder="输入金额" class="field-input">
              </div>
              <div class="form-field" v-if="unifiedConfig.method === 'percent'">
                <label class="field-label">占总额度百分比（%）</label>
                <input type="number" v-model.number="unifiedConfig.percentValue" min="0" max="100" placeholder="0-100" class="field-input">
              </div>
              <div class="form-field" v-if="unifiedConfig.method === 'weight'">
                <label class="field-label">权重依据</label>
                <select v-model="unifiedConfig.weightBasis" class="field-select">
                  <option value="usage">历史使用量</option>
                  <option value="personnel">人员数量</option>
                  <option value="custom">自定义权重</option>
                </select>
              </div>
            </div>

            <!-- 权重配置 -->
            <div v-if="unifiedConfig.method === 'weight' && unifiedConfig.weightBasis === 'custom'" class="weight-config-area">
              <h5 class="sub-title">自定义权重配置</h5>
              <div class="weight-list">
                <div v-for="dept in departments" :key="dept.name" class="weight-item">
                  <span class="dept-name">{{ dept.name }}</span>
                  <input
                    type="number"
                    v-model.number="dept.weight"
                    min="0"
                    step="0.1"
                    class="weight-input"
                    placeholder="权重值"
                  >
                  <span class="weight-percent">{{ getDeptWeightPercent(dept) }}%</span>
                </div>
              </div>
            </div>

            <!-- 预览信息 -->
            <div class="preview-info-box">
              <div class="preview-header">
                <i data-lucide="calculator" style="width: 16px; height: 16px;"></i>
                <span>分配预览</span>
              </div>
              <div class="preview-grid">
                <div class="preview-item">
                  <span class="preview-label">目标账号数</span>
                  <strong class="preview-value">{{ unifiedTargetCount }}</strong>
                </div>
                <div class="preview-item">
                  <span class="preview-label">可分配总额</span>
                  <strong class="preview-value money">¥{{ (availableQuota / 10000).toFixed(2) }}万</strong>
                </div>
                <div class="preview-item">
                  <span class="preview-label">预计单账号</span>
                  <strong class="preview-value">{{ unifiedPerAccount }}</strong>
                </div>
                <div class="preview-item">
                  <span class="preview-label">剩余额度</span>
                  <strong class="preview-value remaining">¥{{ ((availableQuota - unifiedTotalAllocation) / 10000).toFixed(2) }}万</strong>
                </div>
              </div>
            </div>

            <button class="btn-execute-unified" @click="executeUnifiedAllocation" :disabled="!canExecuteUnified">
              <i data-lucide="play" style="width: 16px; height: 16px;"></i>
              执行统一分配
            </button>
          </div>
        </div>

        <!-- 逐级分配模式 -->
        <div v-if="allocationMode === 'hierarchical'" class="config-section hierarchical-config">
          <h4 class="config-title">
            <i data-lucide="git-branch" style="width: 18px; height: 18px;"></i>
            逐级分配设置
          </h4>
          <p class="config-desc">按照组织架构层级逐步分配：公司 → 部门 → 组 → 个人</p>

          <!-- 层级导航 -->
          <div class="hierarchy-nav">
            <button
              v-for="(level, idx) in hierarchyLevels"
              :key="level.key"
              :class="['level-tab', { active: currentLevel === idx, completed: currentLevel > idx }]"
              @click="goToLevel(idx)"
            >
              <i :data-lucide="level.icon" style="width: 14px; height: 14px;"></i>
              {{ level.label }}
              <span v-if="level.allocated !== undefined" class="level-badge">
                ¥{{ (level.allocated / 10000).toFixed(1) }}万
              </span>
            </button>
          </div>

          <!-- 当前层级配置 -->
          <div class="level-config-content">
            <!-- Level 0: 公司级 -->
            <div v-if="currentLevel === 0" class="level-panel">
              <h5 class="level-title">第一级：公司总预算分配</h5>
              <p class="level-desc">设定公司级别的总可用额度，将作为后续各级分配的基础</p>

              <div class="level-form">
                <div class="form-row-2col">
                  <div class="form-field">
                    <label class="field-label">公司总预算（元）</label>
                    <input type="number" v-model.number="hierarchyData.company.totalBudget" class="field-input large" placeholder="输入公司总预算">
                  </div>
                  <div class="form-field">
                    <label class="field-label">预留比例（%）</label>
                    <input type="number" v-model.number="hierarchyData.company.reserveRatio" min="0" max="50" class="field-input" placeholder="预留不分配的比例">
                  </div>
                </div>
                <div class="budget-summary">
                  <div class="summary-item">
                    <span>总预算</span>
                    <strong>¥{{ (hierarchyData.company.totalBudget / 10000).toFixed(2) }}万</strong>
                  </div>
                  <div class="summary-divider">×</div>
                  <div class="summary-item">
                    <span>预留</span>
                    <strong>{{ hierarchyData.company.reserveRatio }}%</strong>
                  </div>
                  <div class="summary-divider">=</div>
                  <div class="summary-item highlight">
                    <span>可分配</span>
                    <strong>¥{{ (companyAvailableBudget / 10000).toFixed(2) }}万</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Level 1: 部门级 -->
            <div v-if="currentLevel === 1" class="level-panel">
              <h5 class="level-title">第二级：部门预算分配</h5>
              <p class="level-desc">将公司可分配预算分配到各个部门</p>

              <div class="dept-allocation-table">
                <table>
                  <thead>
                    <tr>
                      <th>部门名称</th>
                      <th>人数</th>
                      <th>当前配额</th>
                      <th>本次分配</th>
                      <th>分配后总计</th>
                      <th>占比</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="dept in departmentAllocations" :key="dept.name">
                      <td>{{ dept.name }}</td>
                      <td>{{ dept.personCount }}</td>
                      <td class="money-cell">¥{{ (dept.current / 10000).toFixed(2) }}万</td>
                      <td>
                        <input
                          type="number"
                          v-model.number="dept.allocation"
                          class="alloc-input"
                          placeholder="0"
                        >
                      </td>
                      <td class="money-cell total-cell">¥{{ ((dept.current + dept.allocation) / 10000).toFixed(2) }}万</td>
                      <td>
                        <div class="progress-bar-small">
                          <div
                            class="progress-fill"
                            :style="{ width: dept.allocationPercent + '%' }"
                          ></div>
                          <span class="percent-text">{{ dept.allocationPercent.toFixed(1) }}%</span>
                        </div>
                      </td>
                      <td>
                        <button class="btn-auto-calc" @click="autoCalcDept(dept)">自动计算</button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td><strong>合计</strong></td>
                      <td><strong>{{ departmentAllocations.reduce((s, d) => s + d.personCount, 0) }}</strong></td>
                      <td class="money-cell"><strong>¥{{ (departmentAllocations.reduce((s, d) => s + d.current, 0) / 10000).toFixed(2) }}万</strong></td>
                      <td class="money-cell"><strong>¥{{ (departmentTotalAllocation / 10000).toFixed(2) }}万</strong></td>
                      <td class="money-cell total-cell"><strong>¥{{ ((departmentAllocations.reduce((s, d) => s + d.current + d.allocation, 0)) / 10000).toFixed(2) }}万</strong></td>
                      <td><strong>100%</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div class="balance-check" :class="{ warning: deptBalanceDiff !== 0 }">
                <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
                <span>与上级差额：<strong :class="{ negative: deptBalanceDiff < 0 }">¥{{ (deptBalanceDiff / 10000).toFixed(2) }}万</strong></span>
                <button v-if="Math.abs(deptBalanceDiff) > 100" class="btn-balance-fix" @click="fixDeptBalance">自动平衡</button>
              </div>
            </div>

            <!-- Level 2: 组级别 -->
            <div v-if="currentLevel === 2" class="level-panel">
              <h5 class="level-title">第三级：组/团队预算分配</h5>
              <p class="level-desc">选择一个部门，将其预算进一步分配到下属组/团队</p>

              <div class="group-select-area">
                <label class="field-label">选择父级部门</label>
                <select v-model="selectedParentDept" class="field-select large" @change="loadGroupData">
                  <option value="">请选择要分配的部门</option>
                  <option v-for="dept in departmentAllocations.filter(d => d.hasChildren)" :key="dept.name" :value="dept.name">
                    {{ dept.name }}（可分配: ¥{{ ((dept.current + dept.allocation) / 10000).toFixed(2) }}万）
                  </option>
                </select>
              </div>

              <div v-if="selectedParentDept && groupAllocations.length > 0" class="group-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>组/团队</th>
                      <th>人数</th>
                      <th>当前配额</th>
                      <th>本次分配</th>
                      <th>分配后</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="group in groupAllocations" :key="group.name">
                      <td>{{ group.name }}</td>
                      <td>{{ group.personCount }}</td>
                      <td class="money-cell">¥{{ (group.current / 10000).toFixed(2) }}万</td>
                      <td>
                        <input type="number" v-model.number="group.allocation" class="alloc-input" placeholder="0">
                      </td>
                      <td class="money-cell">¥{{ ((group.current + group.allocation) / 10000).toFixed(2) }}万</td>
                      <td>
                        <button class="btn-auto-calc" @click="autoCalcGroup(group)">均分</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="empty-group-hint">
                <i data-lucide="info" style="width: 20px; height: 20px;"></i>
                <p>请先选择一个包含子组的部门</p>
              </div>
            </div>

            <!-- Level 3: 个人级 -->
            <div v-if="currentLevel === 3" class="level-panel">
              <h5 class="level-title">第四级：个人账号分配</h5>
              <p class="level-desc">最终将组预算分配到每个具体的人员账号</p>

              <div class="person-select-area">
                <label class="field-label">选择所属组/团队</label>
                <select v-model="selectedGroup" class="field-select large" @change="loadPersonData">
                  <option value="">请选择组/团队</option>
                  <option v-for="g in availableGroups" :key="g.name" :value="g.name">
                    {{ g.name }}（可分配: ¥{{ ((g.current + g.allocation) / 10000).toFixed(2) }}万）
                  </option>
                </select>
              </div>

              <div v-if="selectedGroup && personAllocations.length > 0" class="person-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>账号ID</th>
                      <th>人员姓名</th>
                      <th>当前配额</th>
                      <th>本次分配</th>
                      <th>分配后</th>
                      <th>分配方式</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="person in personAllocations" :key="person.id">
                      <td>#{{ person.id }}</td>
                      <td>{{ person.name }}</td>
                      <td class="money-cell">¥{{ (person.current / 10000).toFixed(2) }}万</td>
                      <td>
                        <input type="number" v-model.number="person.allocation" class="alloc-input" placeholder="0">
                      </td>
                      <td class="money-cell">¥{{ ((person.current + person.allocation) / 10000).toFixed(2) }}万</td>
                      <td>
                        <select v-model="person.method" class="method-select">
                          <option value="manual">手动输入</option>
                          <option value="equal">等额分配</option>
                          <option value="usage-based">基于使用量</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="2"><strong>合计</strong></td>
                      <td class="money-cell"><strong>¥{{ (personAllocations.reduce((s, p) => s + p.current, 0) / 10000).toFixed(2) }}万</strong></td>
                      <td class="money-cell"><strong>¥{{ (personTotalAllocation / 10000).toFixed(2) }}万</strong></td>
                      <td class="money-cell"><strong>¥{{ (personGrandTotal / 10000).toFixed(2) }}万</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- 层级操作按钮 -->
          <div class="level-actions">
            <button
              v-if="currentLevel > 0"
              class="btn-level-prev"
              @click="prevLevel"
            >
              <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
              上一级
            </button>
            <button
              v-if="currentLevel < 3"
              class="btn-level-next"
              @click="nextLevel"
              :disabled="!canGoNext"
            >
              下一级
              <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
            </button>
            <button
              v-if="currentLevel === 3"
              class="btn-complete-hierarchy"
              @click="completeHierarchicalAllocation"
              :disabled="!canCompleteHierarchy"
            >
              <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
              完成逐级分配
            </button>
          </div>
        </div>
      </div>

      <!-- 额度分配表格 -->
      <div class="quota-table-wrapper">
        <div class="table-header-row">
          <h3 class="table-title">账号额度列表（共 {{ filteredAccounts.length }} 个）</h3>
          <div class="header-actions">
            <div class="search-wrap-member">
              <i data-lucide="search" style="width: 16px; height: 16px; color: #9ca3af;"></i>
              <input v-model="searchKeyword" type="text" placeholder="搜索账号ID或人员姓名..." class="search-input-member">
            </div>
            <select v-model="departmentFilter" class="filter-select-member">
              <option value="">全部部门</option>
              <option>公司</option>
              <option>漫剧部</option>
              <option>电商部</option>
              <option>漫剧1组</option>
              <option>漫剧2组</option>
              <option>电商1组</option>
            </select>
          </div>
        </div>

        <table class="quota-table">
          <thead>
            <tr>
              <th>账号ID</th>
              <th>账号名称</th>
              <th>部门</th>
              <th>关联人员</th>
              <th>当前配额(¥)</th>
              <th>调整金额(¥)</th>
              <th>调整后(¥)</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(account, idx) in pagedAccounts" :key="account.id" :class="{ 'row-changed': account._changed }">
              <td class="cell-id">{{ account.id }}</td>
              <td class="cell-name">{{ account.name }}</td>
              <td>{{ account.department }}</td>
              <td>{{ account.personName }}</td>
              <td class="cell-money">{{ account.allocated.toLocaleString() }}</td>
              <td class="cell-adjust">
                <input
                  type="number"
                  v-model.number="account._adjust"
                  placeholder="0"
                  class="adjust-input"
                  @input="onAdjustChange(account)"
                >
              </td>
              <td class="cell-money cell-total">{{ adjustedTotal(account).toLocaleString() }}</td>
              <td><span :class="['status-tag', getAdjustStatusClass(account)]">{{ getAdjustStatusText(account) }}</span></td>
              <td class="cell-action">
                <button class="action-btn reset-btn" @click="resetAdjust(account)" :disabled="!account._changed">重置</button>
                <button class="action-btn apply-btn" @click="applyAdjust(account)" :disabled="!account._adjust || account._adjust === 0">确认</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 分页器 -->
        <div class="pagination-dept">
          <button class="page-btn-dept" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i>
          </button>
          <button v-for="page in totalPages" :key="page" :class="['page-num-dept', { active: currentPage === page }]" @click="goToPage(page)">{{ page }}</button>
          <button class="page-btn-dept" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
            <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>

      <!-- 批量分配弹窗 -->
      <Teleport to="body">
        <div v-if="showBatchModal" class="modal-overlay" @click.self="closeBatchModal">
          <div class="modal-container-add">
            <div class="modal-header">
              <h3 class="modal-title">批量分配额度</h3>
              <button class="modal-close-btn" @click="closeBatchModal">
                <i data-lucide="x" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">目标部门</label>
                <select v-model="batchForm.department" class="form-select">
                  <option value="">全部账号</option>
                  <option>公司</option>
                  <option>漫剧部</option>
                  <option>电商部</option>
                  <option>漫剧1组</option>
                  <option>漫剧2组</option>
                  <option>电商1组</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">调整方式</label>
                <select v-model="batchForm.mode" class="form-select">
                  <option value="add">增加额度</option>
                  <option value="set">设置固定额度</option>
                  <option value="percent">按百分比调整</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">金额/数值（元）</label>
                <input type="number" v-model.number="batchForm.amount" placeholder="请输入金额" class="form-input">
              </div>
              <div class="batch-preview">
                <p class="preview-text">将影响 <strong>{{ batchTargetCount }}</strong> 个账号</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeBatchModal">取消</button>
              <button class="btn-submit" @click="submitBatch">确认执行</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'
import ProjectHeaderBar from '../../components/enterprise/ProjectHeaderBar.vue'
import { useEnterpriseStore } from '../../stores/enterprise'

const router = useRouter()
const enterpriseStore = useEnterpriseStore()

const tabs = ['概览', '额度分配', '账号管理', '人员管理', '部门管理', '项目管理', '智能路由']
const activeTab = ref('额度分配')
const searchKeyword = ref('')
const departmentFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showBatchModal = ref(false)
const allocationMode = ref('unified')

const batchForm = ref({
  department: '',
  mode: 'add',
  amount: ''
})

const unifiedConfig = ref({
  scope: 'all',
  targetDepartment: '',
  method: 'equal',
  fixedAmount: '',
  percentValue: '',
  weightBasis: 'usage'
})

const departments = ref([
  { name: '公司', weight: 1.0, personCount: 2 },
  { name: '漫剧部', weight: 1.5, personCount: 3 },
  { name: '电商部', weight: 1.2, personCount: 3 },
  { name: '漫剧1组', weight: 0.8, personCount: 2 },
  { name: '漫剧2组', weight: 0.7, personCount: 1 },
  { name: '电商1组', weight: 0.9, personCount: 2 }
])

const hierarchyData = ref({
  company: {
    totalBudget: 600000,
    reserveRatio: 10
  }
})

const currentLevel = ref(0)
const selectedParentDept = ref('')
const selectedGroup = ref('')

const departmentAllocations = ref([
  { name: '公司', personCount: 2, current: 120000, allocation: 80000, hasChildren: false },
  { name: '漫剧部', personCount: 3, current: 150000, allocation: 100000, hasChildren: true },
  { name: '电商部', personCount: 3, current: 130000, allocation: 90000, hasChildren: true },
  { name: '漫剧1组', personCount: 2, current: 50000, allocation: 30000, hasChildren: false },
  { name: '漫剧2组', personCount: 1, current: 30000, allocation: 20000, hasChildren: false },
  { name: '电商1组', personCount: 2, current: 40000, allocation: 25000, hasChildren: false }
])

const groupAllocations = ref([])
const personAllocations = ref([])

const hierarchyLevels = [
  { key: 'company', label: '公司级', icon: 'building-2' },
  { key: 'department', label: '部门级', icon: 'users' },
  { key: 'group', label: '组级', icon: 'user-check' },
  { key: 'person', label: '个人级', icon: 'user' }
]

const accountList = computed(() => enterpriseStore.accountList)

const totalQuota = computed(() => 600000)
const allocatedQuota = computed(() => accountList.value.reduce((s, a) => s + a.allocated + (a._adjust || 0), 0))
const hasChanges = computed(() => accountList.value.some(a => a._changed))

const filteredAccounts = computed(() => {
  let result = accountList.value
  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.toLowerCase()
    result = result.filter(a =>
      String(a.id).includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.personName.toLowerCase().includes(q)
    )
  }
  if (departmentFilter.value) {
    result = result.filter(a => a.department === departmentFilter.value)
  }
  return result
})

const totalPages = computed(() => Math.ceil(filteredAccounts.value.length / pageSize.value) || 1)

const pagedAccounts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredAccounts.value.slice(start, start + pageSize.value)
})

const batchTargetCount = computed(() => {
  if (!batchForm.value.department) return accountList.value.length
  return accountList.value.filter(a => a.department === batchForm.value.department).length
})

const availableQuota = computed(() => totalQuota.value - allocatedQuota.value)

const unifiedTargetCount = computed(() => {
  if (unifiedConfig.value.scope === 'all') return accountList.value.length
  if (unifiedConfig.value.scope === 'department' && unifiedConfig.value.targetDepartment) {
    return accountList.value.filter(a => a.department === unifiedConfig.value.targetDepartment).length
  }
  return accountList.value.length
})

const unifiedTotalAllocation = computed(() => {
  const count = unifiedTargetCount.value

  if (unifiedConfig.value.method === 'equal') {
    return Math.floor(availableQuota.value / count) * count
  }

  if (unifiedConfig.value.method === 'fixed' && unifiedConfig.value.fixedAmount) {
    return unifiedConfig.value.fixedAmount * count
  }

  if (unifiedConfig.value.method === 'percent' && unifiedConfig.value.percentValue) {
    return Math.floor(totalQuota.value * unifiedConfig.value.percentValue / 100)
  }

  if (unifiedConfig.value.method === 'weight') {
    const totalWeight = departments.value.reduce((s, d) => s + d.weight, 0)
    return departments.value.reduce((s, dept) => {
      return s + Math.floor(availableQuota.value * (dept.weight / totalWeight))
    }, 0)
  }

  return 0
})

const unifiedPerAccount = computed(() => {
  if (unifiedTargetCount.value === 0) return '¥0'
  const perAccount = Math.floor(unifiedTotalAllocation.value / unifiedTargetCount.value)
  return `¥${(perAccount / 10000).toFixed(2)}万`
})

const canExecuteUnified = computed(() => {
  if (unifiedConfig.value.scope === 'department' && !unifiedConfig.value.targetDepartment) return false
  if (unifiedConfig.value.method === 'fixed' && !unifiedConfig.value.fixedAmount) return false
  if (unifiedConfig.value.method === 'percent' && !unifiedConfig.value.percentValue) return false
  return unifiedTargetCount.value > 0 && unifiedTotalAllocation.value > 0
})

const companyAvailableBudget = computed(() => {
  const budget = hierarchyData.value.company.totalBudget || 0
  const ratio = hierarchyData.value.company.reserveRatio || 0
  return Math.floor(budget * (1 - ratio / 100))
})

const departmentTotalAllocation = computed(() => {
  return departmentAllocations.value.reduce((s, d) => s + (d.allocation || 0), 0)
})

const deptBalanceDiff = computed(() => {
  return companyAvailableBudget.value - departmentTotalAllocation.value
})

const personTotalAllocation = computed(() => {
  return personAllocations.value.reduce((s, p) => s + (p.allocation || 0), 0)
})

const personGrandTotal = computed(() => {
  return personAllocations.value.reduce((s, p) => s + p.current + (p.allocation || 0), 0)
})

const canGoNext = computed(() => {
  if (currentLevel.value === 0) {
    return hierarchyData.value.company.totalBudget > 0
  }
  if (currentLevel.value === 1) {
    return departmentTotalAllocation.value > 0 && Math.abs(deptBalanceDiff.value) < 10000
  }
  if (currentLevel.value === 2) {
    return groupAllocations.value.some(g => g.allocation > 0)
  }
  return false
})

const canCompleteHierarchy = computed(() => {
  return personAllocations.value.length > 0 && personTotalAllocation.value > 0
})

const availableGroups = computed(() => {
  return groupAllocations.value.filter(g => g.current + g.allocation > 0)
})

const selectTab = (tab) => {
  activeTab.value = tab
  const routeMap = {
    '概览': '/enterprise/bi',
    '额度分配': '/enterprise/quota',
    '账号管理': '/enterprise/member',
    '人员管理': '/enterprise/personnel',
    '部门管理': '/enterprise/department',
    '项目管理': '/enterprise/project',
    '智能路由': '/enterprise/routing'
  }
  if (routeMap[tab]) router.push(routeMap[tab])
}

const switchAllocationMode = (mode) => {
  allocationMode.value = mode
  console.log(`🔄 切换分配模式: ${mode === 'unified' ? '统一分配' : '逐级分配'}`)
}

const getDeptWeightPercent = (dept) => {
  const totalWeight = departments.value.reduce((s, d) => s + d.weight, 0)
  if (totalWeight === 0) return 0
  return ((dept.weight / totalWeight) * 100).toFixed(1)
}

const executeUnifiedAllocation = () => {
  let targets = []

  if (unifiedConfig.value.scope === 'all') {
    targets = [...accountList.value]
  } else if (unifiedConfig.value.scope === 'department') {
    targets = accountList.value.filter(a => a.department === unifiedConfig.value.targetDepartment)
  } else {
    targets = accountList.value.filter(a => a._selected)
  }

  const allocationAmounts = {}

  if (unifiedConfig.value.method === 'equal') {
    const perAccount = Math.floor(unifiedTotalAllocation.value / targets.length)
    targets.forEach(acc => {
      allocationAmounts[acc.id] = perAccount
    })
  } else if (unifiedConfig.value.method === 'fixed') {
    targets.forEach(acc => {
      allocationAmounts[acc.id] = unifiedConfig.value.fixedAmount
    })
  } else if (unifiedConfig.value.method === 'percent') {
    targets.forEach(acc => {
      allocationAmounts[acc.id] = Math.floor(totalQuota.value * unifiedConfig.value.percentValue / 100 / targets.length)
    })
  } else if (unifiedConfig.value.method === 'weight') {
    const totalWeight = departments.value.reduce((s, d) => s + d.weight, 0)
    const deptAllocations = {}
    departments.value.forEach(dept => {
      deptAllocations[dept.name] = Math.floor(unifiedTotalAllocation.value * (dept.weight / totalWeight))
    })

    const deptCounts = {}
    targets.forEach(acc => {
      deptCounts[acc.department] = (deptCounts[acc.department] || 0) + 1
    })

    targets.forEach(acc => {
      const deptTotal = deptAllocations[acc.department] || 0
      const count = deptCounts[acc.department] || 1
      allocationAmounts[acc.id] = Math.floor(deptTotal / count)
    })
  }

  targets.forEach(acc => {
    acc.allocated += (allocationAmounts[acc.id] || 0)
    acc._changed = true
  })

  console.log(`✅ 统一分配执行完成:`)
  console.log(`  - 模式: ${unifiedConfig.value.method}`)
  console.log(`  - 范围: ${unifiedConfig.value.scope}`)
  console.log(`  - 目标数: ${targets.length} 个账号`)
  console.log(`  - 总分配额: ¥${unifiedTotalAllocation.value.toLocaleString()}`)

  alert(`统一分配成功！\n已为 ${targets.length} 个账号分配额度\n总金额: ¥${(unifiedTotalAllocation.value / 10000).toFixed(2)}万`)
}

const goToLevel = (level) => {
  currentLevel.value = level
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const prevLevel = () => {
  if (currentLevel.value > 0) {
    currentLevel.value--
    nextTick(() => {
      if (window.lucide) lucide.createIcons()
    })
  }
}

const nextLevel = () => {
  if (currentLevel.value < 3 && canGoNext.value) {
    currentLevel.value++
    nextTick(() => {
      if (window.lucide) lucide.createIcons()
    })
  }
}

const autoCalcDept = (dept) => {
  const avgPerPerson = companyAvailableBudget.value / departmentAllocations.value.reduce((s, d) => s + d.personCount, 0)
  dept.allocation = Math.round(avgPerPerson * dept.personCount - dept.current)
  if (dept.allocation < 0) dept.allocation = 0
}

const fixDeptBalance = () => {
  const diff = deptBalanceDiff.value
  if (diff === 0) return

  const adjustableDepts = departmentAllocations.value.filter(d => d.hasChildren || d.name !== '公司')
  if (adjustableDepts.length === 0) return

  const perDept = Math.round(diff / adjustableDepts.length)
  adjustableDepts.forEach(dept => {
    dept.allocation += perDept
    if (dept.allocation < 0) dept.allocation = 0
  })
}

const loadGroupData = () => {
  if (!selectedParentDept.value) {
    groupAllocations.value = []
    return
  }

  const parentDept = departmentAllocations.value.find(d => d.name === selectedParentDept.value)
  if (!parentDept) return

  if (selectedParentDept.value === '漫剧部') {
    groupAllocations.value = [
      { name: '漫剧1组', personCount: 2, current: 50000, allocation: 30000 },
      { name: '漫剧2组', personCount: 1, current: 30000, allocation: 20000 }
    ]
  } else if (selectedParentDept.value === '电商部') {
    groupAllocations.value = [
      { name: '电商1组', personCount: 2, current: 40000, allocation: 25000 }
    ]
  } else {
    groupAllocations.value = []
  }
}

const loadPersonData = () => {
  if (!selectedGroup.value) {
    personAllocations.value = []
    return
  }

  const groupAccounts = accountList.value.filter(a => a.department === selectedGroup.value)
  personAllocations.value = groupAccounts.map(acc => ({
    id: acc.id,
    name: acc.personName,
    current: acc.allocated,
    allocation: 0,
    method: 'manual'
  }))
}

const autoCalcGroup = (group) => {
  const selectedDept = departmentAllocations.value.find(d => d.name === selectedParentDept.value)
  if (!selectedDept) return

  const availableForGroups = selectedDept.current + selectedDept.allocation
  const perGroup = Math.round(availableForGroups / groupAllocations.value.length)
  group.allocation = Math.max(0, perGroup - group.current)
}

const completeHierarchicalAllocation = () => {
  personAllocations.value.forEach(person => {
    const account = accountList.value.find(a => a.id === person.id)
    if (account && person.allocation > 0) {
      account.allocated += person.allocation
      account._changed = true
    }
  })

  console.log(`✅ 逐级分配完成:`)
  console.log(`  - 公司预算: ¥${hierarchyData.value.company.totalBudget.toLocaleString()}`)
  console.log(`  - 部门分配: ¥${departmentTotalAllocation.value.toLocaleString()}`)
  console.log(`  - 个人最终: ¥${personTotalAllocation.value.toLocaleString()}`)

  alert(`逐级分配成功完成！\n共为 ${personAllocations.value.length} 个个人账号分配额度\n总计: ¥${(personTotalAllocation.value / 10000).toFixed(2)}万`)
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const adjustedTotal = (account) => {
  return account.allocated + (account._adjust || 0)
}

const onAdjustChange = (account) => {
  account._changed = (account._adjust !== undefined && account._adjust !== 0)
}

const getAdjustStatusClass = (account) => {
  if (!account._changed) return 'status-neutral'
  const total = adjustedTotal(account)
  if (total > account.allocated) return 'status-increase'
  return 'status-decrease'
}

const getAdjustStatusText = (account) => {
  if (!account._changed) return '未调整'
  const total = adjustedTotal(account)
  if (total > account.allocated) return `+${(total - account.allocated).toLocaleString()}`
  return `${(total - account.allocated).toLocaleString()}`
}

const applyAdjust = (account) => {
  if (!account._adjust || account._adjust === 0) return
  account.allocated += account._adjust
  account._adjust = 0
  account._changed = false
}

const resetAdjust = (account) => {
  account._adjust = 0
  account._changed = false
}

const openBatchModal = () => {
  batchForm.value = { department: '', mode: 'add', amount: '' }
  showBatchModal.value = true
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const closeBatchModal = () => {
  showBatchModal.value = false
}

const submitBatch = () => {
  const targets = batchForm.value.department
    ? accountList.value.filter(a => a.department === batchForm.value.department)
    : accountList.value

  const amount = batchForm.value.amount || 0

  targets.forEach(acc => {
    if (batchForm.value.mode === 'add') {
      acc.allocated += amount
    } else if (batchForm.value.mode === 'set') {
      acc.allocated = amount
    } else if (batchForm.value.mode === 'percent') {
      acc.allocated = Math.round(acc.allocated * (1 + amount / 100))
    }
  })

  showBatchModal.value = false
}

const saveQuotaAllocations = () => {
  accountList.value.forEach(a => { a._changed = false })
  alert('额度分配已保存成功！')
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.quota-page {
  max-width: 1400px;
}

.enterprise-tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.tabs-nav {
  display: flex;
  gap: 8px;
}

.ent-tab {
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.ent-tab:hover { color: #3b82f6; }
.ent-tab.active { color: #3b82f6; }
.ent-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2.5px;
  background: #3b82f6;
  border-radius: 2px;
}

.quota-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.quota-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  transition: all 0.25s ease;
}

.quota-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.save-quota-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.save-quota-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-quota-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quota-table-wrapper {
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.table-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-wrap-member {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  padding: 8px 14px;
  background: #f8fafc;
  border: 1.5px solid var(--border-light);
  border-radius: 10px;
}

.search-input-member {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
}

.filter-select-member {
  padding: 8px 14px;
  border: 1.5px solid var(--border-light);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-primary);
  background: white;
  cursor: pointer;
}

.quota-table {
  width: 100%;
  border-collapse: collapse;
}

.quota-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: #f8fafc;
  border-bottom: 1.5px solid var(--border-light);
  white-space: nowrap;
}

.quota-table td {
  padding: 14px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.row-changed {
  background: #fffbeb;
}

.cell-id { font-family: monospace; font-weight: 700; }
.cell-name { font-weight: 600; }
.cell-money { font-weight: 600; font-variant-numeric: tabular-nums; }
.cell-total { color: #6366f1; font-weight: 700; }

.adjust-input {
  width: 120px;
  padding: 7px 12px;
  border: 1.5px solid var(--border-light);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  outline: none;
  transition: all 0.2s ease;
}

.adjust-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.status-neutral { background: #f3f4f6; color: #9ca3af; }
.status-increase { background: #dcfce7; color: #16a34a; }
.status-decrease { background: #fee2e2; color: #dc2626; }

.cell-action {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn {
  background: #f1f5f9;
  color: var(--text-secondary);
}
.reset-btn:hover:not(:disabled) { background: #e2e8f0; }
.reset-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.apply-btn {
  background: #eef2ff;
  color: #3b82f6;
}
.apply-btn:hover:not(:disabled) { background: #bfdbfe; }
.apply-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.pagination-dept {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.page-btn-dept {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid var(--border-light);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}
.page-btn-dept:not(:disabled):hover { border-color: var(--primary-color); color: var(--primary-color); }
.page-btn-dept:disabled { opacity: 0.4; cursor: not-allowed; }

.page-num-dept {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border: 1.5px solid var(--border-light);
  border-radius: 8px;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.page-num-dept:hover { border-color: var(--primary-color); color: var(--primary-color); }
.page-num-dept.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container-add {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.modal-close-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 8px;
  cursor: pointer; color: #6b7280; transition: all 0.2s ease;
}
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }

.modal-body { padding: 24px; }

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.form-select, .form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: all 0.2s ease;
}
.form-select:focus, .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }

.batch-preview {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.preview-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 9px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover { background: #e5e7eb; }

.btn-submit {
  padding: 9px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

.allocation-mode-switch {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.mode-options {
  display: flex;
  gap: 8px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 10px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  color: #6b7280;
}

.mode-btn:hover {
  background: white;
  color: #111827;
}

.mode-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.allocation-config-panel {
  margin-bottom: 24px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.4s ease;
}

.allocation-config-panel.mode-unified {
  border-color: #93c5fd;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.08);
}

.allocation-config-panel.mode-hierarchical {
  border-color: #c4b5fd;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08);
}

.config-section {
  padding: 26px;
}

.config-title {
  font-size: 19px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-desc {
  font-size: 13.5px;
  color: #6b7280;
  margin: 0 0 22px 0;
  line-height: 1.5;
}

.unified-config .config-title {
  color: #2563eb;
}

.hierarchical-config .config-title {
  color: #7c3aed;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row-3col,
.form-row-2col {
  display: grid;
  gap: 16px;
}

.form-row-3col {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.form-row-2col {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.field-select,
.field-input {
  padding: 11px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 9px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: all 0.2s ease;
  background: white;
}

.field-select:focus,
.field-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.field-select.large,
.field-input.large {
  padding: 13px 16px;
  font-size: 15px;
}

.weight-config-area {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  padding: 18px;
  border-radius: 10px;
  border: 1.5px solid #fde047;
}

.sub-title {
  font-size: 15px;
  font-weight: 600;
  color: #854d0e;
  margin: 0 0 14px 0;
}

.weight-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.dept-name {
  font-weight: 600;
  color: #374151;
  min-width: 80px;
}

.weight-input {
  flex: 1;
  max-width: 120px;
  padding: 8px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.weight-percent {
  font-size: 13px;
  font-weight: 700;
  color: #059669;
  min-width: 50px;
  text-align: right;
}

.preview-info-box {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  padding: 18px;
  border-radius: 10px;
  border: 2px solid #bfdbfe;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 14px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.preview-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.preview-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.preview-value {
  font-size: 17px;
  font-weight: 800;
  color: #111827;
}

.preview-value.money {
  color: #059669;
}

.preview-value.remaining {
  color: #dc2626;
}

.btn-execute-unified {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

.btn-execute-unified:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(59, 130, 246, 0.4);
}

.btn-execute-unified:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hierarchy-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
}

.level-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.level-tab:hover {
  border-color: #a78bfa;
  transform: translateY(-2px);
}

.level-tab.active {
  border-color: #7c3aed;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #7c3aed;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
}

.level-tab.completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

.level-badge {
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 10px;
}

.level-config-content {
  min-height: 300px;
}

.level-panel {
  animation: fadeInUp 0.35s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.level-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.level-desc {
  font-size: 13.5px;
  color: #6b7280;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.level-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.budget-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 18px 24px;
  border-radius: 10px;
  border: 2px dashed #f59e0b;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #92400e;
}

.summary-item strong {
  font-size: 18px;
  color: #78350f;
}

.summary-item.highlight strong {
  color: #dc2626;
  font-size: 21px;
}

.summary-divider {
  font-size: 20px;
  font-weight: 800;
  color: #b45309;
}

.dept-allocation-table,
.group-table-wrapper,
.person-table-wrapper {
  overflow-x: auto;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  margin-top: 16px;
}

.dept-allocation-table table,
.group-table-wrapper table,
.person-table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.dept-allocation-table th,
.group-table-wrapper th,
.person-table-wrapper th {
  background: #f9fafb;
  padding: 12px 14px;
  text-align: left;
  font-weight: 700;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.dept-allocation-table td,
.group-table-wrapper td,
.person-table-wrapper td {
  padding: 11px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.money-cell {
  font-weight: 600;
  color: #059669;
  font-family: 'Monaco', monospace;
}

.total-cell {
  color: #111827;
  font-size: 14px;
}

.alloc-input {
  width: 120px;
  padding: 8px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  text-align: right;
}

.alloc-input:focus {
  border-color: #7c3aed;
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.progress-bar-small {
  position: relative;
  width: 100%;
  height: 22px;
  background: #f3f4f6;
  border-radius: 11px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%);
  border-radius: 11px;
  transition: width 0.4s ease;
  min-width: 2px;
}

.percent-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 700;
  color: #374151;
}

.total-row {
  background: #f9fafb !important;
  font-weight: 700;
}

.btn-auto-calc {
  padding: 6px 14px;
  background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
  border: 1.5px solid #a78bfa;
  border-radius: 6px;
  color: #5b21b6;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-auto-calc:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);
}

.balance-check {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 14px 18px;
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 8px;
  font-size: 14px;
  color: #166534;
}

.balance-check.warning {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.balance-check .negative {
  color: #dc2626;
}

.btn-balance-fix {
  margin-left: auto;
  padding: 7px 16px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border: none;
  border-radius: 6px;
  color: #78350f;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-balance-fix:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
}

.group-select-area,
.person-select-area {
  margin-bottom: 18px;
}

.empty-group-hint {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-group-hint p {
  margin-top: 12px;
  font-size: 14px;
}

.method-select {
  padding: 7px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 12.5px;
  color: #374151;
  cursor: pointer;
  outline: none;
}

.method-select:focus {
  border-color: #7c3aed;
}

.level-actions {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.btn-level-prev,
.btn-level-next,
.btn-complete-hierarchy {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 26px;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-level-prev {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #374151;
}

.btn-level-prev:hover:not(:disabled) {
  transform: translateX(-3px);
  box-shadow: -4px 6px 14px rgba(107, 114, 128, 0.25);
}

.btn-level-next {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  margin-left: auto;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
}

.btn-level-next:hover:not(:disabled) {
  transform: translateX(3px);
  box-shadow: 4px 6px 18px rgba(124, 58, 237, 0.4);
}

.btn-complete-hierarchy {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  width: 100%;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
}

.btn-complete-hierarchy:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(5, 150, 105, 0.4);
}

.btn-level-prev:disabled,
.btn-level-next:disabled,
.btn-complete-hierarchy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
