"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

export type FlowNodeState = "done" | "normal" | "attention" | "urgent" | "locked";

/** deeplink の開き方。既定 "_self"("_blank" は rel="noreferrer" を自動付与)。 */
export type FlowLinkTarget = "_self" | "_blank";

export type FlowNode = {
  id: string;
  label: ReactNode;
  /** 業務アイコン(呼び出し側から ReactNode で渡す。bf-ui は lucide 非依存) */
  icon?: ReactNode;
  state: FlowNodeState;
  /** 状態の文字併記(例:「未記録 3日分」)。色だけの状態表現を避けるための必須級の補助情報 */
  statusText?: ReactNode;
  /** deeplink。locked のときは遷移無効になる */
  href?: string;
  /** 展開マニュアル(開閉式) */
  manual?: ReactNode;
  /** ノードのアクセント色(ModuleHome と同流儀で --bf-primary に注入) */
  accent?: string;
  /**
   * v3.2: 個別モジュール(子)。アプリ(親、本ノード)の右にコンパクトカードで縦積みする
   * (2階層まで。子の children は無視する)。子は手順展開を持たない簡略表示(状態アイコン+ラベル+
   * statusText のみ)。親の state は「自身のライブ状態と全子の最悪状態のマージ」を呼び出し側で
   * 計算して渡す(FlowTree は渡された state を表示するだけ)。
   */
  children?: FlowNode[];
  /**
   * v3.3: このノードが属するモジュール名(小タグ表示)。「やるべきこと(label)」と「どのモジュールで
   * やるか(moduleLabel)」を視覚的に分離する。SoT は呼び出し側(DB shared.modules.name)にあり、
   * bf-ui はハードコードしない。statusText とは別要素で並置される。
   */
  moduleLabel?: ReactNode;
  /**
   * v3.4: hover / focus で表示する補足説明(カード上部の吹き出し)。モジュール説明などの
   * 「常時見せるほどではないが知りたい」情報向け。ネイティブ title は表示遅延・省略で
   * 挙動が不安定なため使わず、CSS 吹き出し(.bf-flow-hint)で出す。情報の唯一の担い手に
   * しないこと(Tooltip と同じ原則 — 必須情報は本文へ)。aria-describedby で SR にも届く。
   */
  description?: ReactNode;
};

export type FlowPhase = {
  id: string;
  title: ReactNode;
  caption?: ReactNode;
  nodes: FlowNode[];
  /**
   * "row"(既定) = 順番に進むステップ列。各カードにステップ番号バッジを付ける。
   * "grid" = 並列タスク(どれから着手してもよい)。番号バッジを付けない。
   * どちらもカードは縦1列のトランクに積まれ、見た目の違いは番号バッジの有無のみ
   * (v3.1 でカード間の横矢印チェーンは廃止)。呼び出し側は「この並びに意味順序があるか」で
   * 必ずどちらかを明示する。
   */
  layout?: "row" | "grid";
};

const STATE_LABEL_JA: Record<FlowNodeState, string> = {
  done: "完了",
  normal: "通常",
  attention: "要対応",
  urgent: "緊急",
  locked: "権限なし",
};

/** 先頭の状態アイコンは done/locked のときだけ表示する(normal は無印、attention/urgent はバッジ or 帯で表現)。 */
function showLeadingStateIcon(state: FlowNodeState): boolean {
  return state === "done" || state === "locked";
}

function StateBadge({ tone, children }: { tone: "warning" | "danger"; children: ReactNode }) {
  return (
    <span className="bf-flow-badge" data-tone={tone}>
      {children}
    </span>
  );
}

function StateGlyph({ state }: { state: FlowNodeState }) {
  switch (state) {
    case "done":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="5 13 10 18 19 6" />
        </svg>
      );
    case "attention":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4 L22 20 H2 Z" />
          <line x1="12" y1="10" x2="12" y2="14" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "urgent":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="7.5" x2="12" y2="13" />
          <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      );
    case "locked":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" />
          <path d="M8 11 V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "normal":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="6" fill="currentColor" />
        </svg>
      );
  }
}

function StateIcon({ state }: { state: FlowNodeState }) {
  return (
    <span className="bf-flow-state-icon" data-state={state} aria-hidden="true">
      <StateGlyph state={state} />
    </span>
  );
}

function LegendSample({ state }: { state: FlowNodeState }) {
  if (state === "normal") {
    return <span className="bf-flow-state-icon" data-state="normal" aria-hidden="true" />;
  }
  if (state === "attention") {
    return <span className="bf-flow-legend__badge-sample" aria-hidden="true" />;
  }
  return <StateIcon state={state} />;
}

function FlowTreeLegend() {
  const states: FlowNodeState[] = ["done", "normal", "attention", "urgent", "locked"];
  return (
    <ul className="bf-flow-legend">
      {states.map((s) => (
        <li className="bf-flow-legend__item" key={s}>
          <LegendSample state={s} />
          <span>{STATE_LABEL_JA[s]}</span>
        </li>
      ))}
    </ul>
  );
}

function FlowTreeNode({
  node,
  step,
  linkTarget = "_self",
  idBase,
}: {
  node: FlowNode;
  step?: number;
  linkTarget?: FlowLinkTarget;
  idBase?: string;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const autoManualId = useId();
  const autoHintId = useId();
  const manualId = idBase ? `${idBase}-${node.id}-manual` : autoManualId;
  const hintId = idBase ? `${idBase}-${node.id}-hint` : autoHintId;
  const locked = node.state === "locked";
  const asLink = Boolean(node.href) && !locked;
  const style = node.accent ? ({ "--bf-primary": node.accent } as CSSProperties) : undefined;
  const showTopFlag = node.state === "urgent";
  const hasMeta = Boolean(node.moduleLabel) || node.state === "attention" || Boolean(node.statusText);

  const mainContent = (
    <>
      {typeof step === "number" && (
        <span className="bf-flow-node__step" aria-label={`手順${step}`}>
          {step}
        </span>
      )}
      {showLeadingStateIcon(node.state) && <StateIcon state={node.state} />}
      {node.icon && (
        <span className="bf-flow-node__icon" aria-hidden="true">
          {node.icon}
        </span>
      )}
      <span className="bf-flow-node__body">
        <span className="bf-flow-node__label">{node.label}</span>
        {hasMeta && (
          <span className="bf-flow-node__meta">
            {node.moduleLabel && <span className="bf-flow-node__module">{node.moduleLabel}</span>}
            {node.state === "attention" && <StateBadge tone="warning">{STATE_LABEL_JA.attention}</StateBadge>}
            {node.statusText && <span className="bf-flow-node__status">{node.statusText}</span>}
          </span>
        )}
        {locked && <span className="bf-flow-node__locked-text">権限がありません</span>}
      </span>
      {node.description && (
        <span className="bf-flow-hint" role="tooltip" id={hintId}>
          {node.description}
        </span>
      )}
    </>
  );

  return (
    <div className="bf-flow-node" data-state={node.state} style={style}>
      {showTopFlag && (
        <div className="bf-flow-node__flag" data-state={node.state}>
          <span className="bf-flow-node__flag-icon" aria-hidden="true">
            <StateGlyph state={node.state} />
          </span>
          <span>{STATE_LABEL_JA[node.state]}</span>
        </div>
      )}
      {asLink ? (
        <a
          className="bf-flow-node__main"
          href={node.href}
          target={linkTarget === "_blank" ? "_blank" : undefined}
          rel={linkTarget === "_blank" ? "noreferrer" : undefined}
          aria-describedby={node.description ? hintId : undefined}
        >
          {mainContent}
        </a>
      ) : (
        <button
          type="button"
          className="bf-flow-node__main"
          aria-disabled={!asLink || undefined}
          aria-describedby={node.description ? hintId : undefined}
        >
          {mainContent}
        </button>
      )}
      {node.manual && (
        <div className="bf-flow-node__manual">
          <button
            type="button"
            className="bf-flow-node__manual-trigger"
            aria-expanded={manualOpen}
            aria-controls={manualId}
            onClick={() => setManualOpen((o) => !o)}
          >
            <span>手順を見る</span>
            <svg
              className="bf-flow-node__manual-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {manualOpen && (
            <div id={manualId} className="bf-flow-node__manual-panel" role="region">
              {node.manual}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlowTreeChildNode({
  node,
  linkTarget = "_self",
  idBase,
}: {
  node: FlowNode;
  linkTarget?: FlowLinkTarget;
  idBase?: string;
}) {
  const autoHintId = useId();
  const hintId = idBase ? `${idBase}-${node.id}-hint` : autoHintId;
  const locked = node.state === "locked";
  const asLink = Boolean(node.href) && !locked;
  const style = node.accent ? ({ "--bf-primary": node.accent } as CSSProperties) : undefined;
  const hasMeta =
    Boolean(node.statusText) || node.state === "attention" || node.state === "urgent";

  const content = (
    <>
      {showLeadingStateIcon(node.state) && <StateIcon state={node.state} />}
      <span className="bf-flow-child__body">
        <span className="bf-flow-child__label-row">
          <span className="bf-flow-child__label">{node.label}</span>
          {node.moduleLabel && <span className="bf-flow-child__module">{node.moduleLabel}</span>}
        </span>
        {hasMeta && (
          <span className="bf-flow-child__meta">
            {node.state === "attention" && <StateBadge tone="warning">{STATE_LABEL_JA.attention}</StateBadge>}
            {node.state === "urgent" && <StateBadge tone="danger">{STATE_LABEL_JA.urgent}</StateBadge>}
            {node.statusText && <span className="bf-flow-child__status">{node.statusText}</span>}
          </span>
        )}
      </span>
      {node.description && (
        <span className="bf-flow-hint" role="tooltip" id={hintId}>
          {node.description}
        </span>
      )}
    </>
  );

  return asLink ? (
    <a
      className="bf-flow-child"
      data-state={node.state}
      style={style}
      href={node.href}
      target={linkTarget === "_blank" ? "_blank" : undefined}
      rel={linkTarget === "_blank" ? "noreferrer" : undefined}
      aria-describedby={node.description ? hintId : undefined}
    >
      {content}
    </a>
  ) : (
    <button
      type="button"
      className="bf-flow-child"
      data-state={node.state}
      style={style}
      aria-disabled={locked || undefined}
      aria-describedby={node.description ? hintId : undefined}
    >
      {content}
    </button>
  );
}

function buildPhaseStatuses(nodes: FlowNode[]): string[] {
  const urgentCount = nodes.filter((n) => n.state === "urgent").length;
  const attentionCount = nodes.filter((n) => n.state === "attention").length;
  const statuses: string[] = [];
  if (urgentCount > 0) statuses.push(`緊急 ${urgentCount} 件`);
  if (attentionCount > 0) statuses.push(`要対応 ${attentionCount} 件`);
  if (statuses.length === 0 && nodes.length > 0 && nodes.every((n) => n.state === "done")) {
    statuses.push("完了");
  }
  return statuses;
}

export function FlowTree({
  phases,
  legend,
  linkTarget = "_self",
  id,
}: {
  phases: FlowPhase[];
  legend?: boolean;
  /** deeplink の開き方(既定 "_self")。"_blank" はポータルのモジュール起動と同じく新規タブで開く。 */
  linkTarget?: FlowLinkTarget;
  /**
   * 手順の開閉・吹き出しの aria id ベース。省略時は useId() で自動採番する。
   * middleware rewrite で配信される面では SSR と CSR で useId() が食い違い hydration mismatch になるため、
   * そうした面では呼び出し側で安定 id を明示する(Tabs の id と同じ対処)。
   */
  id?: string;
}) {
  return (
    <div className="bf-flow-tree">
      {legend && <FlowTreeLegend />}
      <div className="bf-flow-tree__phases">
        {phases.map((phase, phaseIndex) => {
          const layout = phase.layout ?? "row";
          const statuses = buildPhaseStatuses(phase.nodes);
          const isLast = phaseIndex === phases.length - 1;
          return (
            <section className="bf-flow-phase" key={phase.id}>
              <header className="bf-flow-phase__header">
                <div className="bf-flow-phase__heading">
                  <span className="bf-flow-phase__marker" aria-label={`フェーズ${phaseIndex + 1}`}>
                    {phaseIndex + 1}
                  </span>
                  <h3 className="bf-flow-phase__title">{phase.title}</h3>
                </div>
                {phase.caption && <p className="bf-flow-phase__caption">{phase.caption}</p>}
                {statuses.length > 0 && <p className="bf-flow-phase__status">{statuses.join("・")}</p>}
              </header>

              {}
              <div className="bf-flow-phase__stem" aria-hidden="true" />

              {}
              <div className="bf-flow-phase__trunk">
                {phase.nodes.map((node, nodeIndex) => (
                  <div className="bf-flow-phase__row" key={node.id}>
                    {node.children && node.children.length > 0 ? (
                      <div className="bf-flow-node-group">
                        <div className="bf-flow-node-group__parent">
                          <FlowTreeNode
                            node={node}
                            step={layout === "row" ? nodeIndex + 1 : undefined}
                            linkTarget={linkTarget}
                        idBase={id}
                          />
                        </div>
                        <div className="bf-flow-node-group__children">
                          {node.children.map((child) => (
                            <div className="bf-flow-node-group__child-row" key={child.id}>
                              <FlowTreeChildNode node={child} linkTarget={linkTarget} idBase={id} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <FlowTreeNode
                        node={node}
                        step={layout === "row" ? nodeIndex + 1 : undefined}
                        linkTarget={linkTarget}
                        idBase={id}
                      />
                    )}
                  </div>
                ))}
              </div>

              {}
              {!isLast && <div className="bf-flow-phase__next" aria-hidden="true" />}
            </section>
          );
        })}
      </div>
    </div>
  );
}
