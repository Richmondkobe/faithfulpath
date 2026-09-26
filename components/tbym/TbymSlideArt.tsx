import type { CSSProperties, ReactElement } from "react";

/**
 * The line illustrations for Talk Before You Marry.
 *
 * Converted from the pilot page's ART map into JSX rather than kept as SVG
 * strings, so nothing in this course sets raw markup. Lesson 1 needed twenty
 * of these; the other thirteen lessons reuse those and add six — coins, ear,
 * hourglass, house, scales and sunrise. Each is drawn with a stroke that
 * animates on, and the animation is dropped entirely under
 * prefers-reduced-motion — see TbymSlidePlayer.module.css.
 *
 * A slide names one of these in its "art" field. An unknown name renders
 * nothing, which is what an illustration should do when it is missing.
 */
export const TBYM_SLIDE_ART: Record<string, ReactElement> = {
  arrow: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><circle className="draw" pathLength="1" cx="100" cy="80" r="52"/><path className="draw s2" style={{ "--d": ".8s" } as CSSProperties} pathLength="1" d="M72 80L128 80M110 62L128 80L110 98"/></svg>
  ),
  body: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><circle className="draw" pathLength="1" cx="100" cy="36" r="16"/><circle className="draw" style={{ "--d": ".3s" } as CSSProperties} pathLength="1" cx="44" cy="124" r="16"/><circle className="draw" style={{ "--d": ".6s" } as CSSProperties} pathLength="1" cx="156" cy="124" r="16"/><path className="draw s2" style={{ "--d": "1s" } as CSSProperties} pathLength="1" d="M91 50L52 110M109 50L148 110M60 124L140 124"/><circle className="pop f loop" style={{ "--d": "1.8s" } as CSSProperties} cx="100" cy="98" r="6"/></svg>
  ),
  book: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M100 40C80 30 50 30 30 38L30 120C50 112 80 112 100 122Z"/><path className="draw" style={{ "--d": ".4s" } as CSSProperties} pathLength="1" d="M100 40C120 30 150 30 170 38L170 120C150 112 120 112 100 122Z"/><path className="draw s2" style={{ "--d": "1s" } as CSSProperties} pathLength="1" d="M45 58C62 54 78 56 90 62M45 76C62 72 78 74 90 80M110 62C122 56 138 54 155 58M110 80C122 74 138 72 155 76"/></svg>
  ),
  bubbles: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><ellipse className="draw" pathLength="1" cx="58" cy="62" rx="42" ry="30"/><circle className="pop" style={{ "--d": ".8s", "fill": "var(--amber)", "stroke": "none" } as CSSProperties} cx="82" cy="100" r="5"/><circle className="pop" style={{ "--d": "1s", "fill": "var(--amber)", "stroke": "none" } as CSSProperties} cx="92" cy="112" r="3"/><ellipse className="draw s2" style={{ "--d": ".6s" } as CSSProperties} pathLength="1" cx="142" cy="62" rx="42" ry="30"/><circle className="pop" style={{ "--d": "1.2s", "fill": "var(--cream)", "stroke": "none" } as CSSProperties} cx="118" cy="100" r="5"/><circle className="pop" style={{ "--d": "1.4s", "fill": "var(--cream)", "stroke": "none" } as CSSProperties} cx="108" cy="112" r="3"/><path className="draw" style={{ "--d": "1.6s" } as CSSProperties} pathLength="1" d="M42 72L42 60L58 48L74 60L74 72Z"/><path className="draw s2" style={{ "--d": "1.9s" } as CSSProperties} pathLength="1" d="M134 72L134 66L142 58L150 66L150 72Z"/></svg>
  ),
  candle: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M82 84L82 142L118 142L118 84Z"/><path className="draw s2" style={{ "--d": ".5s" } as CSSProperties} pathLength="1" d="M100 84L100 72"/><g className="flick"><path className="draw" style={{ "--d": ".9s" } as CSSProperties} pathLength="1" d="M100 70C84 54 94 38 100 24C106 38 116 54 100 70Z"/></g><path className="draw s2 faded" style={{ "--d": "1.6s" } as CSSProperties} pathLength="1" d="M58 58L70 64M142 58L130 64M52 84L66 84M148 84L134 84"/></svg>
  ),
  coins: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><ellipse className="draw" pathLength="1" cx="76" cy="120" rx="36" ry="13"/><path className="draw" style={{ "--d": ".3s" } as CSSProperties} pathLength="1" d="M40 120L40 98M112 120L112 98"/><ellipse className="draw" style={{ "--d": ".5s" } as CSSProperties} pathLength="1" cx="76" cy="98" rx="36" ry="13"/><path className="draw" style={{ "--d": ".8s" } as CSSProperties} pathLength="1" d="M40 98L40 76M112 98L112 76"/><ellipse className="draw" style={{ "--d": "1s" } as CSSProperties} pathLength="1" cx="76" cy="76" rx="36" ry="13"/><circle className="draw s2" style={{ "--d": "1.4s" } as CSSProperties} pathLength="1" cx="154" cy="60" r="26"/><circle className="pop f" style={{ "--d": "2.2s" } as CSSProperties} cx="154" cy="60" r="5"/></svg>
  ),
  door: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M92 134L92 30L158 30L158 134M80 134L170 134"/><circle className="pop f" style={{ "--d": "1s" } as CSSProperties} cx="146" cy="84" r="4"/><path className="draw s2" style={{ "--d": "1.2s" } as CSSProperties} pathLength="1" d="M74 84L24 84M38 72L24 84L38 96"/></svg>
  ),
  ear: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M110 142C86 142 72 126 72 102L72 68C72 40 94 22 120 22C146 22 166 42 166 68C166 88 152 96 140 102C130 107 124 112 124 122C124 133 118 142 110 142Z"/><path className="draw s2" style={{ "--d": ".9s" } as CSSProperties} pathLength="1" d="M102 98L102 72C102 58 111 50 123 50C135 50 144 59 144 71"/><path className="draw faded" style={{ "--d": "1.5s" } as CSSProperties} pathLength="1" d="M44 58C34 70 34 94 44 106M20 44C4 62 4 102 20 120"/></svg>
  ),
  hourglass: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M56 20L144 20M56 140L144 140"/><path className="draw" style={{ "--d": ".4s" } as CSSProperties} pathLength="1" d="M66 20C66 56 100 70 100 80C100 90 66 104 66 140M134 20C134 56 100 70 100 80C100 90 134 104 134 140"/><path className="draw s2 faded" style={{ "--d": "1.2s" } as CSSProperties} pathLength="1" d="M78 36L122 36"/><circle className="pop f" style={{ "--d": "1.8s" } as CSSProperties} cx="100" cy="98" r="4"/><path className="draw s2" style={{ "--d": "2s" } as CSSProperties} pathLength="1" d="M80 126C86 116 114 116 120 126"/></svg>
  ),
  house: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M28 84L100 26L172 84"/><path className="draw" style={{ "--d": ".6s" } as CSSProperties} pathLength="1" d="M46 70L46 136L154 136L154 70"/><path className="draw s2" style={{ "--d": "1.2s" } as CSSProperties} pathLength="1" d="M84 136L84 92L116 92L116 136"/><circle className="pop f" style={{ "--d": "2s" } as CSSProperties} cx="109" cy="114" r="3.5"/></svg>
  ),
  love: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><g className="loop"><path className="draw" pathLength="1" d="M100 128C40 90 44 40 82 44C94 46 100 56 100 62C100 56 106 46 118 44C156 40 160 90 100 128Z"/></g><path className="draw s2" style={{ "--d": "1s" } as CSSProperties} pathLength="1" d="M56 148L144 148"/></svg>
  ),
  map: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw s2" pathLength="1" style={{ "stroke-dasharray": "1" } as CSSProperties} d="M24 134C64 134 56 100 100 100C144 100 130 80 166 78"/><circle className="pop f" style={{ "--d": ".2s" } as CSSProperties} cx="24" cy="134" r="5"/><path className="draw" style={{ "--d": "1.6s" } as CSSProperties} pathLength="1" d="M166 78C152 60 154 32 166 32C178 32 180 60 166 78Z"/><circle className="pop f" style={{ "--d": "2.4s" } as CSSProperties} cx="166" cy="48" r="5"/></svg>
  ),
  paper: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M54 20L128 20L152 44L152 140L54 140Z"/><path className="draw" style={{ "--d": ".4s" } as CSSProperties} pathLength="1" d="M128 20L128 44L152 44"/><path className="draw s2" style={{ "--d": ".9s" } as CSSProperties} pathLength="1" d="M70 68L112 68M70 88L112 88M70 108L96 108"/><path className="draw" style={{ "--d": "1.6s" } as CSSProperties} pathLength="1" d="M108 106C108 98 124 98 124 106C124 113 116 113 116 121"/><circle className="pop f" style={{ "--d": "2.2s" } as CSSProperties} cx="116" cy="129" r="3.5"/></svg>
  ),
  pause: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><g className="loop"><circle className="draw" pathLength="1" cx="100" cy="80" r="54"/></g><path className="draw s2" style={{ "--d": ".8s" } as CSSProperties} pathLength="1" d="M84 58L84 102M116 58L116 102"/></svg>
  ),
  peace: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw s2" pathLength="1" d="M20 46L180 46"/><path className="draw" style={{ "--d": ".8s" } as CSSProperties} pathLength="1" d="M20 112C35 72 50 152 65 112C80 72 95 152 110 112C125 72 140 152 155 112C165 90 175 102 180 112"/></svg>
  ),
  pencil: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M34 122L42 96L122 16L148 42L68 122ZM42 96L68 122L34 122Z"/><path className="draw s2" style={{ "--d": "1s" } as CSSProperties} pathLength="1" d="M92 138L172 138M112 118L172 118M132 98L172 98"/></svg>
  ),
  please: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw s2 faded" pathLength="1" d="M112 26L172 26L172 74L146 74L134 88L136 74L112 74Z"/><path className="draw" style={{ "--d": ".5s" } as CSSProperties} pathLength="1" d="M28 56L112 56L112 116L66 116L48 136L52 116L28 116Z"/><circle className="pop f" style={{ "--d": "1.4s" } as CSSProperties} cx="54" cy="82" r="3.5"/><circle className="pop f" style={{ "--d": "1.5s" } as CSSProperties} cx="86" cy="82" r="3.5"/><path className="draw" style={{ "--d": "1.6s" } as CSSProperties} pathLength="1" d="M54 98C62 108 78 108 86 98"/></svg>
  ),
  pseudos: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw s2 faded" pathLength="1" d="M24 50L60 34L84 62L112 30L140 64L176 42"/><path className="draw" style={{ "--d": "1s" } as CSSProperties} pathLength="1" d="M24 106L176 106"/><path className="draw" style={{ "--d": "2s" } as CSSProperties} pathLength="1" d="M84 130L98 144L124 120"/></svg>
  ),
  pulse: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M10 84L58 84L70 54L84 116L98 34L112 104L122 84L190 84"/><circle className="pop f loop" style={{ "--d": "1.6s" } as CSSProperties} cx="190" cy="84" r="5"/></svg>
  ),
  question: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><circle className="draw" pathLength="1" cx="100" cy="80" r="56"/><path className="draw s2" style={{ "--d": ".8s" } as CSSProperties} pathLength="1" d="M78 64C78 40 122 40 122 64C122 82 100 84 100 102"/><circle className="pop f" style={{ "--d": "1.8s" } as CSSProperties} cx="100" cy="120" r="4"/></svg>
  ),
  rings: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><circle className="draw" pathLength="1" cx="78" cy="80" r="46"/><circle className="draw s2" style={{ "--d": ".5s" } as CSSProperties} pathLength="1" cx="122" cy="80" r="46"/><circle className="pop f" style={{ "--d": "1.4s" } as CSSProperties} cx="100" cy="80" r="5"/></svg>
  ),
  scales: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><circle className="pop f" style={{ "--d": ".2s" } as CSSProperties} cx="100" cy="26" r="5"/><path className="draw" style={{ "--d": ".3s" } as CSSProperties} pathLength="1" d="M100 30L100 132M78 140L122 140M100 132L82 140M100 132L118 140"/><path className="draw" style={{ "--d": ".6s" } as CSSProperties} pathLength="1" d="M34 48L166 48"/><path className="draw s2" style={{ "--d": "1.1s" } as CSSProperties} pathLength="1" d="M34 48L34 64M12 64C12 86 56 86 56 64Z"/><path className="draw s2" style={{ "--d": "1.4s" } as CSSProperties} pathLength="1" d="M166 48L166 64M144 64C144 86 188 86 188 64Z"/></svg>
  ),
  shield: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><g className="loop"><path className="draw" pathLength="1" d="M100 20L158 40L158 82C158 112 132 132 100 142C68 132 42 112 42 82L42 40Z"/></g><path className="draw s2" style={{ "--d": "1s" } as CSSProperties} pathLength="1" d="M74 70L126 70M74 92L126 92"/></svg>
  ),
  six: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw s2" pathLength="1" d="M100 24L148 52L148 108L100 136L52 108L52 52Z"/><circle className="pop f" style={{ "--d": ".3s" } as CSSProperties} cx="100" cy="24" r="7"/><circle className="pop f" style={{ "--d": ".6s" } as CSSProperties} cx="148" cy="52" r="7"/><circle className="pop f" style={{ "--d": ".9s" } as CSSProperties} cx="148" cy="108" r="7"/><circle className="pop f" style={{ "--d": "1.2s" } as CSSProperties} cx="100" cy="136" r="7"/><circle className="pop f" style={{ "--d": "1.5s" } as CSSProperties} cx="52" cy="108" r="7"/><circle className="pop f" style={{ "--d": "1.8s" } as CSSProperties} cx="52" cy="52" r="7"/></svg>
  ),
  story: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw" pathLength="1" d="M40 46L40 134M40 102L82 102L82 134"/><path className="draw s2" style={{ "--d": ".5s" } as CSSProperties} pathLength="1" d="M160 46L160 134M160 102L118 102L118 134"/><circle className="pop f" style={{ "--d": "1.4s" } as CSSProperties} cx="90" cy="70" r="3.5"/><circle className="pop f" style={{ "--d": "1.8s" } as CSSProperties} cx="100" cy="70" r="3.5"/><circle className="pop f" style={{ "--d": "2.2s" } as CSSProperties} cx="110" cy="70" r="3.5"/></svg>
  ),
  sunrise: (
    <svg viewBox="0 0 200 160" aria-hidden="true"><path className="draw s2" pathLength="1" d="M16 118L184 118"/><path className="draw" style={{ "--d": ".5s" } as CSSProperties} pathLength="1" d="M56 118C56 94 76 74 100 74C124 74 144 94 144 118"/><path className="draw faded" style={{ "--d": "1.2s" } as CSSProperties} pathLength="1" d="M100 56L100 34M58 68L46 50M142 68L154 50M36 96L16 88M164 96L184 88"/><circle className="pop f" style={{ "--d": "2.2s" } as CSSProperties} cx="100" cy="118" r="5"/></svg>
  ),
};
