// ============================================================
// BasilicaGameCore — BasilicaScript Interpreter
// A minimal DSL for card effects and game rules.
// BasilicaStudiosLLC
// ============================================================

import {
  ScriptExecutionContext,
  ScriptExecutionResult,
  StateMutation,
  ScriptEventType,
  SCRIPT_EXECUTION_TIMEOUT_MS,
  MAX_SCRIPT_LENGTH,
} from '@basilica/shared';
import { getPath, setPath } from '@basilica/shared';

// ─── Token Types ────────────────────────────────────────────

type TokenType =
  | 'NUMBER' | 'STRING' | 'BOOL' | 'NULL'
  | 'IDENT'
  | 'ON' | 'IF' | 'ELSE' | 'SET' | 'LET'
  | 'DEAL_DAMAGE' | 'HEAL' | 'DRAW_CARDS' | 'DISCARD_CARDS'
  | 'LOG' | 'END_GAME' | 'NEXT_PHASE' | 'END_TURN'
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'PERCENT'
  | 'EQ' | 'NEQ' | 'LT' | 'GT' | 'LTE' | 'GTE'
  | 'AND' | 'OR' | 'NOT'
  | 'ASSIGN'
  | 'DOT' | 'LPAREN' | 'RPAREN' | 'LBRACE' | 'RBRACE'
  | 'COMMA' | 'SEMICOLON'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  line: number;
}

const KEYWORDS: Record<string, TokenType> = {
  on: 'ON', if: 'IF', else: 'ELSE', set: 'SET', let: 'LET',
  true: 'BOOL', false: 'BOOL', null: 'NULL',
  and: 'AND', or: 'OR', not: 'NOT',
  deal_damage: 'DEAL_DAMAGE', heal: 'HEAL',
  draw_cards: 'DRAW_CARDS', discard_cards: 'DISCARD_CARDS',
  log: 'LOG', end_game: 'END_GAME',
  next_phase: 'NEXT_PHASE', end_turn: 'END_TURN',
};

// ─── Lexer ──────────────────────────────────────────────────

class Lexer {
  private pos = 0;
  private line = 1;

  constructor(private source: string) {}

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.source.length) {
      const tok = this.nextToken();
      if (tok) tokens.push(tok);
    }
    tokens.push({ type: 'EOF', value: '', line: this.line });
    return tokens;
  }

  private peek(offset = 0): string {
    return this.source[this.pos + offset] ?? '';
  }

  private advance(): string {
    const ch = this.source[this.pos++];
    if (ch === '\n') this.line++;
    return ch;
  }

  private nextToken(): Token | null {
    // Skip whitespace
    while (this.pos < this.source.length && /\s/.test(this.peek())) this.advance();
    if (this.pos >= this.source.length) return null;

    // Comments
    if (this.peek() === '/' && this.peek(1) === '/') {
      while (this.pos < this.source.length && this.peek() !== '\n') this.advance();
      return null;
    }

    const line = this.line;
    const ch = this.peek();

    // Numbers
    if (/\d/.test(ch)) {
      let num = '';
      while (/[\d.]/.test(this.peek())) num += this.advance();
      return { type: 'NUMBER', value: num, line };
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const quote = this.advance();
      let str = '';
      while (this.pos < this.source.length && this.peek() !== quote) {
        str += this.advance();
      }
      this.advance(); // closing quote
      return { type: 'STRING', value: str, line };
    }

    // Identifiers / keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (/[\w]/.test(this.peek())) ident += this.advance();
      const type = KEYWORDS[ident] ?? 'IDENT';
      return { type, value: ident, line };
    }

    // Two-char operators
    this.advance();
    const twoChar = ch + this.peek();
    if (twoChar === '==') { this.advance(); return { type: 'EQ', value: '==', line }; }
    if (twoChar === '!=') { this.advance(); return { type: 'NEQ', value: '!=', line }; }
    if (twoChar === '<=') { this.advance(); return { type: 'LTE', value: '<=', line }; }
    if (twoChar === '>=') { this.advance(); return { type: 'GTE', value: '>=', line }; }

    const single: Record<string, TokenType> = {
      '+': 'PLUS', '-': 'MINUS', '*': 'STAR', '/': 'SLASH', '%': 'PERCENT',
      '<': 'LT', '>': 'GT', '=': 'ASSIGN',
      '.': 'DOT', '(': 'LPAREN', ')': 'RPAREN',
      '{': 'LBRACE', '}': 'RBRACE',
      ',': 'COMMA', ';': 'SEMICOLON',
    };
    if (single[ch]) return { type: single[ch], value: ch, line };

    return null; // Unknown char — skip
  }
}

// ─── AST Nodes ──────────────────────────────────────────────

type ASTNode =
  | { kind: 'Program'; body: ASTNode[] }
  | { kind: 'EventHandler'; event: string; body: ASTNode[] }
  | { kind: 'IfStatement'; condition: ASTNode; then: ASTNode[]; else?: ASTNode[] }
  | { kind: 'Assignment'; path: string; value: ASTNode }
  | { kind: 'BinaryExpr'; op: string; left: ASTNode; right: ASTNode }
  | { kind: 'UnaryExpr'; op: string; operand: ASTNode }
  | { kind: 'CallExpr'; callee: string; args: ASTNode[] }
  | { kind: 'MemberExpr'; path: string }
  | { kind: 'Literal'; value: number | string | boolean | null };

// ─── Parser ─────────────────────────────────────────────────

class Parser {
  private pos = 0;

  constructor(private tokens: Token[]) {}

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }
  private check(type: TokenType): boolean { return this.peek().type === type; }
  private match(...types: TokenType[]): boolean {
    if (types.includes(this.peek().type)) { this.advance(); return true; }
    return false;
  }

  parse(): ASTNode {
    const body: ASTNode[] = [];
    while (!this.check('EOF')) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    return { kind: 'Program', body };
  }

  private parseStatement(): ASTNode | null {
    if (this.check('ON')) return this.parseEventHandler();
    if (this.check('IF')) return this.parseIf();
    if (this.check('SET') || this.check('LET')) return this.parseAssignment();
    if (this.isBuiltin()) return this.parseCall();
    if (this.check('IDENT')) return this.parseExprStatement();
    this.advance(); // skip unknown
    return null;
  }

  private parseEventHandler(): ASTNode {
    this.advance(); // on
    const event = this.advance().value;
    this.advance(); // {
    const body: ASTNode[] = [];
    while (!this.check('RBRACE') && !this.check('EOF')) {
      const s = this.parseStatement();
      if (s) body.push(s);
    }
    this.advance(); // }
    return { kind: 'EventHandler', event, body };
  }

  private parseIf(): ASTNode {
    this.advance(); // if
    const condition = this.parseExpression();
    this.advance(); // {
    const then: ASTNode[] = [];
    while (!this.check('RBRACE') && !this.check('EOF')) {
      const s = this.parseStatement();
      if (s) then.push(s);
    }
    this.advance(); // }
    let elseBody: ASTNode[] | undefined;
    if (this.match('ELSE')) {
      this.advance(); // {
      elseBody = [];
      while (!this.check('RBRACE') && !this.check('EOF')) {
        const s = this.parseStatement();
        if (s) elseBody.push(s);
      }
      this.advance(); // }
    }
    return { kind: 'IfStatement', condition, then, else: elseBody };
  }

  private parseAssignment(): ASTNode {
    this.advance(); // set/let
    const path = this.parsePath();
    this.advance(); // =
    const value = this.parseExpression();
    this.match('SEMICOLON');
    return { kind: 'Assignment', path, value };
  }

  private parsePath(): string {
    let path = this.advance().value;
    while (this.match('DOT')) {
      path += '.' + this.advance().value;
    }
    return path;
  }

  private isBuiltin(): boolean {
    const builtins: TokenType[] = [
      'DEAL_DAMAGE', 'HEAL', 'DRAW_CARDS', 'DISCARD_CARDS',
      'LOG', 'END_GAME', 'NEXT_PHASE', 'END_TURN',
    ];
    return builtins.includes(this.peek().type);
  }

  private parseCall(): ASTNode {
    const callee = this.advance().value;
    const args: ASTNode[] = [];
    if (this.match('LPAREN')) {
      while (!this.check('RPAREN') && !this.check('EOF')) {
        args.push(this.parseExpression());
        this.match('COMMA');
      }
      this.advance(); // )
    }
    this.match('SEMICOLON');
    return { kind: 'CallExpr', callee, args };
  }

  private parseExprStatement(): ASTNode {
    const expr = this.parseExpression();
    this.match('SEMICOLON');
    return expr;
  }

  private parseExpression(): ASTNode {
    return this.parseOr();
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.match('OR')) {
      left = { kind: 'BinaryExpr', op: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseEquality();
    while (this.match('AND')) {
      left = { kind: 'BinaryExpr', op: 'and', left, right: this.parseEquality() };
    }
    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseComparison();
    while (this.check('EQ') || this.check('NEQ')) {
      const op = this.advance().value;
      left = { kind: 'BinaryExpr', op, left, right: this.parseComparison() };
    }
    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAddSub();
    while (['LT','GT','LTE','GTE'].includes(this.peek().type)) {
      const op = this.advance().value;
      left = { kind: 'BinaryExpr', op, left, right: this.parseAddSub() };
    }
    return left;
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();
    while (this.check('PLUS') || this.check('MINUS')) {
      const op = this.advance().value;
      left = { kind: 'BinaryExpr', op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  private parseMulDiv(): ASTNode {
    let left = this.parseUnary();
    while (['STAR','SLASH','PERCENT'].includes(this.peek().type)) {
      const op = this.advance().value;
      left = { kind: 'BinaryExpr', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.match('NOT')) {
      return { kind: 'UnaryExpr', op: 'not', operand: this.parsePrimary() };
    }
    if (this.match('MINUS')) {
      return { kind: 'UnaryExpr', op: 'neg', operand: this.parsePrimary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek();
    if (tok.type === 'NUMBER') { this.advance(); return { kind: 'Literal', value: Number(tok.value) }; }
    if (tok.type === 'STRING') { this.advance(); return { kind: 'Literal', value: tok.value }; }
    if (tok.type === 'BOOL') { this.advance(); return { kind: 'Literal', value: tok.value === 'true' }; }
    if (tok.type === 'NULL') { this.advance(); return { kind: 'Literal', value: null }; }
    if (tok.type === 'LPAREN') {
      this.advance();
      const expr = this.parseExpression();
      this.advance(); // )
      return expr;
    }
    if (tok.type === 'IDENT') {
      const path = this.parsePath();
      return { kind: 'MemberExpr', path };
    }
    this.advance();
    return { kind: 'Literal', value: null };
  }
}

// ─── Interpreter ────────────────────────────────────────────

class Interpreter {
  private mutations: StateMutation[] = [];
  private logs: string[] = [];
  private errors: string[] = [];
  private ctx: ScriptExecutionContext;

  constructor(ctx: ScriptExecutionContext) {
    this.ctx = ctx;
  }

  run(ast: ASTNode): ScriptExecutionResult {
    try {
      const program = ast as { kind: 'Program'; body: ASTNode[] };
      for (const node of program.body) {
        if (node.kind === 'EventHandler') {
          if (node.event === this.ctx.eventType || node.event === this.ctx.eventType.replace('on_', '')) {
            this.execBlock(node.body);
          }
        }
      }
    } catch (err) {
      this.errors.push(String(err));
    }
    return {
      success: this.errors.length === 0,
      mutations: this.mutations,
      errors: this.errors,
      log: this.logs,
    };
  }

  private execBlock(stmts: ASTNode[]): void {
    for (const stmt of stmts) this.execNode(stmt);
  }

  private execNode(node: ASTNode): void {
    switch (node.kind) {
      case 'IfStatement': {
        const cond = this.evalNode(node.condition);
        if (cond) this.execBlock(node.then);
        else if (node.else) this.execBlock(node.else);
        break;
      }
      case 'Assignment': {
        const val = this.evalNode(node.value);
        this.mutations.push({ type: 'set', path: node.path, value: val });
        break;
      }
      case 'CallExpr': {
        this.execBuiltin(node.callee, node.args);
        break;
      }
    }
  }

  private evalNode(node: ASTNode): unknown {
    switch (node.kind) {
      case 'Literal': return node.value;
      case 'MemberExpr': {
        const ctx = this.ctx.gameState.scriptContext as Record<string, unknown>;
        const val = getPath(ctx, node.path);
        return val ?? getPath(this.ctx.gameState as unknown as Record<string, unknown>, node.path);
      }
      case 'BinaryExpr': {
        const l = this.evalNode(node.left);
        const r = this.evalNode(node.right);
        switch (node.op) {
          case '+': return (l as number) + (r as number);
          case '-': return (l as number) - (r as number);
          case '*': return (l as number) * (r as number);
          case '/': return (l as number) / (r as number);
          case '%': return (l as number) % (r as number);
          case '==': return l === r;
          case '!=': return l !== r;
          case '<': return (l as number) < (r as number);
          case '>': return (l as number) > (r as number);
          case '<=': return (l as number) <= (r as number);
          case '>=': return (l as number) >= (r as number);
          case 'and': return Boolean(l) && Boolean(r);
          case 'or': return Boolean(l) || Boolean(r);
        }
        break;
      }
      case 'UnaryExpr': {
        const v = this.evalNode(node.operand);
        if (node.op === 'not') return !v;
        if (node.op === 'neg') return -(v as number);
        break;
      }
    }
    return null;
  }

  private execBuiltin(callee: string, argNodes: ASTNode[]): void {
    const args = argNodes.map(a => this.evalNode(a));
    switch (callee) {
      case 'log':
        this.logs.push(String(args[0] ?? ''));
        break;
      case 'deal_damage': {
        const [target, amount] = args as [string, number];
        this.mutations.push({ type: 'increment', path: `players.${target}.health`, value: -amount });
        this.logs.push(`Dealt ${amount} damage to ${target}`);
        break;
      }
      case 'heal': {
        const [target, amount] = args as [string, number];
        this.mutations.push({ type: 'increment', path: `players.${target}.health`, value: amount });
        this.logs.push(`Healed ${target} for ${amount}`);
        break;
      }
      case 'draw_cards': {
        const [target, count] = args as [string, number];
        this.mutations.push({ type: 'append', path: `decks.${target}.draw_trigger`, value: count });
        this.logs.push(`${target} draws ${count} card(s)`);
        break;
      }
      case 'discard_cards': {
        const [target, count] = args as [string, number];
        this.mutations.push({ type: 'append', path: `decks.${target}.discard_trigger`, value: count });
        this.logs.push(`${target} discards ${count} card(s)`);
        break;
      }
      case 'end_turn':
        this.mutations.push({ type: 'set', path: 'turnState.forceEnd', value: true });
        this.logs.push('Turn ended by script');
        break;
      case 'next_phase':
        this.mutations.push({ type: 'set', path: 'turnState.advancePhase', value: true });
        this.logs.push('Phase advanced by script');
        break;
      case 'end_game': {
        const [winner] = args as [string];
        this.mutations.push({ type: 'set', path: 'gameOver', value: true });
        this.mutations.push({ type: 'set', path: 'winner', value: winner ?? null });
        this.logs.push(`Game ended. Winner: ${winner ?? 'none'}`);
        break;
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────────

export function executeScript(
  source: string,
  ctx: ScriptExecutionContext
): ScriptExecutionResult {
  if (source.length > MAX_SCRIPT_LENGTH) {
    return { success: false, mutations: [], errors: ['Script exceeds maximum length'], log: [] };
  }

  try {
    const tokens = new Lexer(source).tokenize();
    const ast = new Parser(tokens).parse();
    return new Interpreter(ctx).run(ast);
  } catch (err) {
    return { success: false, mutations: [], errors: [`Parse error: ${err}`], log: [] };
  }
}

export function validateScript(source: string): { valid: boolean; errors: string[] } {
  try {
    const tokens = new Lexer(source).tokenize();
    new Parser(tokens).parse();
    return { valid: true, errors: [] };
  } catch (err) {
    return { valid: false, errors: [String(err)] };
  }
}
