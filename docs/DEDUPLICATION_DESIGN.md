# 智能去重系统设计

## 问题分析

采集源常见问题：
- 分类错误（电影标成电视剧）
- 年份错误（2025标成2024）
- 演员名不一致（中文/英文/别名）
- 标题略有差异（"复仇者联盟" vs "复仇者联盟4"）
- 简介相似但来源不同

## 核心思路

使用**多维度相似度算法**，综合判断是否为同一作品，然后合并播放源。

---

## 1. 去重算法设计

### 1.1 特征提取

```typescript
interface VideoFeatures {
    // 基础特征
    title: string;           // 标题（标准化后）
    titlePinyin: string;     // 标题拼音
    year: number;            // 年份
    
    // 内容特征
    director: string[];      // 导演列表（标准化）
    actors: string[];        // 演员列表（标准化）
    duration: number;        // 时长
    
    // 语义特征
    description: string;     // 简介
    descriptionKeywords: string[];  // 简介关键词
    
    // 类型特征
    episodeCount: number;    // 集数（0=电影）
    isSeries: boolean;       // 是否剧集
}
```

### 1.2 标准化处理

```typescript
class FeatureNormalizer {
    // 标题标准化
    normalizeTitle(title: string): string {
        return title
            .toLowerCase()
            .replace(/[第].*?[部季]/g, '')  // 移除"第一部"、"第二季"
            .replace(/\d+/g, '')             // 移除数字
            .replace(/[^\u4e00-\u9fa5a-z]/g, '')  // 只保留中文和字母
            .trim();
    }
    
    // 人名标准化
    normalizePerson(name: string): string {
        // 中文名 → 拼音
        if (/[\u4e00-\u9fa5]/.test(name)) {
            return pinyin(name, { style: pinyin.STYLE_NORMAL }).join('');
        }
        // 英文名 → 小写
        return name.toLowerCase().replace(/[^a-z]/g, '');
    }
    
    // 演员列表标准化并排序
    normalizeActors(actors: string[]): string[] {
        return actors
            .map(a => this.normalizePerson(a))
            .filter(a => a.length > 0)
            .sort();
    }
    
    // 年份容错（±1年）
    normalizeYear(year: number): number[] {
        return [year - 1, year, year + 1];
    }
}
```

### 1.3 多维度相似度计算

```typescript
class SimilarityCalculator {
    // 标题相似度（编辑距离 + 包含关系）
    calculateTitleSimilarity(title1: string, title2: string): number {
        const normalized1 = normalizer.normalizeTitle(title1);
        const normalized2 = normalizer.normalizeTitle(title2);
        
        // 完全匹配
        if (normalized1 === normalized2) return 1.0;
        
        // 包含关系
        if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
            return 0.9;
        }
        
        // 编辑距离
        const distance = levenshtein(normalized1, normalized2);
        const maxLen = Math.max(normalized1.length, normalized2.length);
        return 1 - (distance / maxLen);
    }
    
    // 演员相似度（Jaccard系数）
    calculateActorSimilarity(actors1: string[], actors2: string[]): number {
        const set1 = new Set(normalizer.normalizeActors(actors1));
        const set2 = new Set(normalizer.normalizeActors(actors2));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    // 导演相似度
    calculateDirectorSimilarity(directors1: string[], directors2: string[]): number {
        return this.calculateActorSimilarity(directors1, directors2);
    }
    
    // 简介语义相似度（关键词匹配）
    calculateDescriptionSimilarity(desc1: string, desc2: string): number {
        const keywords1 = this.extractKeywords(desc1);
        const keywords2 = this.extractKeywords(desc2);
        
        return this.calculateActorSimilarity(keywords1, keywords2);
    }
    
    // 年份相似度
    calculateYearSimilarity(year1: number, year2: number): number {
        const diff = Math.abs(year1 - year2);
        if (diff === 0) return 1.0;
        if (diff === 1) return 0.8;
        if (diff === 2) return 0.5;
        return 0;
    }
    
    // 类型相似度（电影 vs 电视剧）
    calculateTypeSimilarity(isSeries1: boolean, isSeries2: boolean): number {
        return isSeries1 === isSeries2 ? 1.0 : 0.3;  // 类型不同但可能匹配
    }
}
```

### 1.4 综合相似度评分

```typescript
interface SimilarityWeights {
    title: number;       // 0.35
    actors: number;      // 0.25
    director: number;    // 0.15
    year: number;        // 0.10
    description: number; // 0.10
    type: number;        // 0.05
}

const DEFAULT_WEIGHTS: SimilarityWeights = {
    title: 0.35,
    actors: 0.25,
    director: 0.15,
    year: 0.10,
    description: 0.10,
    type: 0.05
};

function calculateOverallSimilarity(
    v1: VideoFeatures,
    v2: VideoFeatures,
    weights: SimilarityWeights = DEFAULT_WEIGHTS
): number {
    const calculator = new SimilarityCalculator();
    
    const similarities = {
        title: calculator.calculateTitleSimilarity(v1.title, v2.title),
        actors: calculator.calculateActorSimilarity(v1.actors, v2.actors),
        director: calculator.calculateDirectorSimilarity(v1.director, v2.director),
        year: calculator.calculateYearSimilarity(v1.year, v2.year),
        description: calculator.calculateDescriptionSimilarity(v1.description, v2.description),
        type: calculator.calculateTypeSimilarity(v1.isSeries, v2.isSeries)
    };
    
    // 加权求和
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [key, similarity] of Object.entries(similarities)) {
        const weight = weights[key as keyof SimilarityWeights];
        totalScore += similarity * weight;
        totalWeight += weight;
    }
    
    return totalScore / totalWeight;
}
```

---

## 2. 去重决策引擎

### 2.1 分级阈值策略

```typescript
interface DedupThresholds {
    autoMerge: number;      // 0.90 - 自动合并
    manualReview: number;   // 0.75 - 人工审核
    different: number;      // 0.50 - 视为不同
}

const THRESHOLDS: DedupThresholds = {
    autoMerge: 0.90,     // 高度相似，自动合并
    manualReview: 0.75,  // 可能相同，需要确认
    different: 0.50      // 低于此值，视为不同
};
```

### 2.2 决策流程

```typescript
enum DedupDecision {
    AUTO_MERGE = 'auto_merge',      // 自动合并
    MANUAL_REVIEW = 'manual_review', // 人工审核
    KEEP_SEPARATE = 'keep_separate', // 保持独立
    NEED_MORE_INFO = 'need_more_info' // 信息不足
}

function makeDedupDecision(similarity: number, v1: VideoFeatures, v2: VideoFeatures): DedupDecision {
    // 标题完全相同，自动合并
    if (similarity >= THRESHOLDS.autoMerge) {
        return DedupDecision.AUTO_MERGE;
    }
    
    // 高相似度，但类型不同（可能是翻拍）
    if (similarity >= THRESHOLDS.manualReview && v1.isSeries !== v2.isSeries) {
        return DedupDecision.MANUAL_REVIEW;
    }
    
    // 中等相似度
    if (similarity >= THRESHOLDS.manualReview) {
        return DedupDecision.MANUAL_REVIEW;
    }
    
    // 低相似度
    if (similarity >= THRESHOLDS.different) {
        // 检查是否有强特征匹配（如导演+主演都相同）
        if (isStrongMatch(v1, v2)) {
            return DedupDecision.MANUAL_REVIEW;
        }
    }
    
    return DedupDecision.KEEP_SEPARATE;
}

// 强特征匹配（导演+2个以上主演相同）
function isStrongMatch(v1: VideoFeatures, v2: VideoFeatures): boolean {
    const calculator = new SimilarityCalculator();
    
    const directorSim = calculator.calculateDirectorSimilarity(v1.director, v2.director);
    const actorSim = calculator.calculateActorSimilarity(v1.actors, v2.actors);
    
    // 导演相同，且演员有2个以上相同
    return directorSim > 0.9 && actorSim > 0.3;
}
```

---

## 3. 播放源合并策略

### 3.1 源去重

```typescript
interface VideoSource {
    name: string;      // 线路名称
    url: string;       // 播放地址
    type: string;      // m3u8/mp4/flv
    quality: string;   // 清晰度
    sourceFrom: string; // 来源站点
}

function mergeSources(sources1: VideoSource[], sources2: VideoSource[]): VideoSource[] {
    const merged = [...sources1];
    
    for (const source2 of sources2) {
        // 检查是否已存在相同URL
        const exists = merged.some(s => normalizeUrl(s.url) === normalizeUrl(source2.url));
        if (!exists) {
            // 检查是否有相同名称的线路
            const sameNameIndex = merged.findIndex(s => s.name === source2.name);
            if (sameNameIndex >= 0) {
                // 保留质量更好的
                if (compareQuality(source2.quality, merged[sameNameIndex].quality) > 0) {
                    merged[sameNameIndex] = source2;
                }
            } else {
                merged.push(source2);
            }
        }
    }
    
    return merged;
}

// URL标准化（移除参数差异）
function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.hostname}${urlObj.pathname}`;
    } catch {
        return url.replace(/\?.*$/, '');
    }
}

// 清晰度比较
function compareQuality(q1: string, q2: string): number {
    const qualityMap: Record<string, number> = {
        '4K': 4, '2160P': 4,
        '1080P': 3, 'HD': 3,
        '720P': 2,
        '480P': 1, 'SD': 1
    };
    return (qualityMap[q1] || 0) - (qualityMap[q2] || 0);
}
```

---

## 4. 完整去重流程

```typescript
class DeduplicationService {
    async deduplicate(newVideo: VideoInput): Promise<DedupResult> {
        // 1. 提取特征
        const features = this.extractFeatures(newVideo);
        
        // 2. 查找候选匹配
        const candidates = await this.findCandidates(features);
        
        // 3. 计算相似度
        const matches: MatchResult[] = [];
        for (const candidate of candidates) {
            const similarity = calculateOverallSimilarity(features, candidate.features);
            matches.push({ candidate, similarity });
        }
        
        // 4. 排序，取最相似的
        matches.sort((a, b) => b.similarity - a.similarity);
        
        if (matches.length === 0) {
            return { decision: DedupDecision.KEEP_SEPARATE, video: newVideo };
        }
        
        const bestMatch = matches[0];
        
        // 5. 决策
        const decision = makeDedupDecision(bestMatch.similarity, features, bestMatch.candidate.features);
        
        // 6. 执行决策
        switch (decision) {
            case DedupDecision.AUTO_MERGE:
                return await this.autoMerge(newVideo, bestMatch.candidate);
            case DedupDecision.MANUAL_REVIEW:
                return await this.queueForReview(newVideo, matches);
            case DedupDecision.KEEP_SEPARATE:
            default:
                return { decision, video: newVideo };
        }
    }
    
    // 查找候选（使用数据库索引优化）
    private async findCandidates(features: VideoFeatures): Promise<VideoCandidate[]> {
        // 策略1：标题相似（使用数据库模糊查询）
        const byTitle = await prisma.videos.findMany({
            where: {
                OR: [
                    { title: { contains: features.title.slice(0, 4) } },
                    { normalizedTitle: features.titlePinyin }
                ],
                year: { in: [features.year - 1, features.year, features.year + 1] }
            },
            take: 20
        });
        
        // 策略2：演员匹配
        const byActors = await prisma.videos.findMany({
            where: {
                actors: { hasSome: features.actors.slice(0, 3) }
            },
            take: 10
        });
        
        // 合并去重
        const candidates = [...byTitle, ...byActors];
        return this.removeDuplicates(candidates);
    }
    
    // 自动合并
    private async autoMerge(newVideo: VideoInput, existing: VideoCandidate): Promise<DedupResult> {
        // 合并播放源
        const mergedSources = mergeSources(existing.sources, newVideo.sources);
        
        // 选择最佳信息
        const mergedVideo = {
            ...existing,
            // 保留更完整的标题
            title: newVideo.title.length > existing.title.length ? newVideo.title : existing.title,
            // 合并演员（去重）
            actors: [...new Set([...existing.actors, ...newVideo.actors])],
            // 合并简介（保留更长的）
            description: newVideo.description.length > existing.description.length 
                ? newVideo.description : existing.description,
            // 更新播放源
            sources: mergedSources,
            // 记录来源
            sourceSites: [...existing.sourceSites, newVideo.sourceFrom]
        };
        
        // 更新数据库
        await prisma.videos.update({
            where: { id: existing.id },
            data: mergedVideo
        });
        
        return {
            decision: DedupDecision.AUTO_MERGE,
            video: mergedVideo,
            mergedWith: existing.id
        };
    }
    
    // 加入人工审核队列
    private async queueForReview(newVideo: VideoInput, matches: MatchResult[]): Promise<DedupResult> {
        await prisma.dedupReviewQueue.create({
            data: {
                newVideo: JSON.stringify(newVideo),
                candidates: JSON.stringify(matches.map(m => ({
                    videoId: m.candidate.id,
                    similarity: m.similarity
                }))),
                status: 'pending',
                createdAt: new Date()
            }
        });
        
        return {
            decision: DedupDecision.MANUAL_REVIEW,
            video: newVideo,
            reviewQueue: true
        };
    }
}
```

---

## 5. 人工审核界面

```typescript
// 审核队列数据结构
interface ReviewItem {
    id: string;
    newVideo: VideoInput;
    candidates: {
        videoId: string;
        similarity: number;
        video: Video;  // 现有视频
    }[];
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

// 审核操作
async function reviewDedup(reviewId: string, action: 'merge' | 'separate', mergeWith?: string) {
    const review = await prisma.dedupReviewQueue.findUnique({ where: { id: reviewId } });
    
    if (action === 'merge' && mergeWith) {
        // 执行合并
        const existing = await prisma.videos.findUnique({ where: { id: mergeWith } });
        await deduplicationService.autoMerge(review.newVideo, existing);
    } else {
        // 保持独立，作为新视频插入
        await prisma.videos.create({ data: review.newVideo });
    }
    
    // 更新审核状态
    await prisma.dedupReviewQueue.update({
        where: { id: reviewId },
        data: { status: action === 'merge' ? 'approved' : 'rejected' }
    });
}
```

---

## 6. 数据表设计

```sql
-- 去重审核队列
CREATE TABLE dedup_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    new_video JSONB NOT NULL,
    candidates JSONB NOT NULL,
    similarity_scores JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewer_id INTEGER,
    review_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- 视频特征缓存（加速去重）
CREATE TABLE video_features (
    video_id INTEGER PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
    normalized_title VARCHAR(255),
    title_pinyin VARCHAR(255),
    actor_names TEXT[],
    director_names TEXT[],
    keywords TEXT[],
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_dedup_queue_status ON dedup_review_queue(status);
CREATE INDEX idx_video_features_title ON video_features(normalized_title);
CREATE INDEX idx_video_features_pinyin ON video_features(title_pinyin);
```

---

## 7. 性能优化

### 7.1 预处理特征

```typescript
// 采集时预计算特征
async function precomputeFeatures(videoId: number) {
    const video = await prisma.videos.findUnique({ where: { id: videoId } });
    
    await prisma.videoFeatures.create({
        data: {
            videoId: video.id,
            normalizedTitle: normalizer.normalizeTitle(video.title),
            titlePinyin: pinyin(video.title, { style: pinyin.STYLE_NORMAL }).join(''),
            actorNames: video.actors.map(a => normalizer.normalizePerson(a)),
            directorNames: video.director.map(d => normalizer.normalizePerson(d)),
            keywords: extractKeywords(video.description)
        }
    });
}
```

### 7.2 批量去重

```typescript
// 批量处理采集数据
async function batchDeduplicate(videos: VideoInput[]): Promise<DedupResult[]> {
    const results: DedupResult[] = [];
    
    // 先内部去重（同一批次）
    const internalGroups = groupBySimilarity(videos);
    
    for (const group of internalGroups) {
        if (group.length === 1) {
            // 单条，与数据库去重
            results.push(await deduplicationService.deduplicate(group[0]));
        } else {
            // 多条相似，合并后去重
            const merged = mergeVideoGroup(group);
            results.push(await deduplicationService.deduplicate(merged));
        }
    }
    
    return results;
}
```

---

## 8. 总结

| 特性 | 说明 |
|---|---|
| **多维度相似度** | 标题、演员、导演、年份、简介、类型 |
| **智能阈值** | 自动合并(0.9)、人工审核(0.75)、独立(0.5) |
| **容错设计** | 年份±1、标题模糊匹配、演员别名 |
| **源合并** | 自动去重URL，保留多线路 |
| **人工审核** | 不确定时加入审核队列 |
| **性能优化** | 预计算特征、数据库索引、批量处理 |

**核心优势**：
1. 容错能力强（分类错、年份错都能识别）
2. 自动合并高置信度匹配
3. 低置信度转人工审核
4. 播放源智能整合