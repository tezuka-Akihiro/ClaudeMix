/**
 * generate-specs.js のテスト
 *
 * YAML anchor/alias/merge key のサポートを確認するテスト
 */

import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';

describe('YAML anchor/alias support', () => {
  it('anchorとaliasを正しく展開できる', () => {
    const yamlString = `
defaults: &defaults
  timeout: 5000

loader:
  <<: *defaults
  method: GET
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.loader.timeout).toBe(5000);
    expect(parsed.loader.method).toBe('GET');
  });

  it('複数のmerge keyを処理できる', () => {
    const yamlString = `
base: &base
  required: true

email_field: &email
  <<: *base
  type: email

form:
  email:
    <<: *email
    label: "Email"
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.form.email.required).toBe(true);
    expect(parsed.form.email.type).toBe('email');
    expect(parsed.form.email.label).toBe('Email');
  });

  it('上書きが正しく動作する', () => {
    const yamlString = `
defaults: &defaults
  timeout: 5000
  retry: 3

action:
  <<: *defaults
  timeout: 10000
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.action.timeout).toBe(10000); // 上書きされた値
    expect(parsed.action.retry).toBe(3); // 継承された値
  });

  it('_templatesセクションを含むspecファイルを正しくパースできる', () => {
    const yamlString = `
metadata:
  feature_name: "test-feature"
  version: "1.0.0"

_templates:
  _field_defaults: &field_defaults
    required: true

  _email_field: &email_field
    <<: *field_defaults
    name: "email"
    label: "メールアドレス"
    type: "email"

forms:
  login:
    email:
      <<: *email_field
      autocomplete: "email"
`;

    const parsed = yaml.load(yamlString);

    // _templatesセクションが存在する
    expect(parsed._templates).toBeDefined();
    expect(parsed._templates._field_defaults.required).toBe(true);

    // フォームフィールドが正しく展開されている
    expect(parsed.forms.login.email.name).toBe('email');
    expect(parsed.forms.login.email.label).toBe('メールアドレス');
    expect(parsed.forms.login.email.type).toBe('email');
    expect(parsed.forms.login.email.required).toBe(true);
    expect(parsed.forms.login.email.autocomplete).toBe('email');
  });

  it('複数階層のmerge keyを処理できる', () => {
    const yamlString = `
_templates:
  _base: &base
    required: true
    disabled: false

  _input: &input
    <<: *base
    autocomplete: "off"

  _email: &email
    <<: *input
    type: "email"
    label: "Email"

forms:
  register:
    email:
      <<: *email
      autocomplete: "email"
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.forms.register.email.required).toBe(true);
    expect(parsed.forms.register.email.disabled).toBe(false);
    expect(parsed.forms.register.email.type).toBe('email');
    expect(parsed.forms.register.email.label).toBe('Email');
    expect(parsed.forms.register.email.autocomplete).toBe('email'); // 上書き
  });

  it('anchor定義順序に依存しない（定義後に参照する限り）', () => {
    const yamlString = `
# anchor定義は使用前に配置する必要がある
_field_base: &field_base
  required: true

# anchorを参照
form:
  email:
    <<: *field_base
    type: email
`;

    const parsed = yaml.load(yamlString);

    expect(parsed.form.email.required).toBe(true);
    expect(parsed.form.email.type).toBe('email');
  });

  it('同一ファイル内の異なる場所で同じanchorを複数回参照できる', () => {
    const yamlString = `
_field_defaults: &field_defaults
  required: true
  disabled: false

forms:
  login:
    email:
      <<: *field_defaults
      type: email
    password:
      <<: *field_defaults
      type: password

  register:
    email:
      <<: *field_defaults
      type: email
    password:
      <<: *field_defaults
      type: password
`;

    const parsed = yaml.load(yamlString);

    // login form
    expect(parsed.forms.login.email.required).toBe(true);
    expect(parsed.forms.login.email.disabled).toBe(false);
    expect(parsed.forms.login.password.required).toBe(true);
    expect(parsed.forms.login.password.disabled).toBe(false);

    // register form
    expect(parsed.forms.register.email.required).toBe(true);
    expect(parsed.forms.register.email.disabled).toBe(false);
    expect(parsed.forms.register.password.required).toBe(true);
    expect(parsed.forms.register.password.disabled).toBe(false);
  });
});

describe('YAML anchor/alias error cases', () => {
  it('未定義のanchorを参照するとエラーになる', () => {
    const yamlString = `
form:
  email:
    <<: *undefined_anchor
    type: email
`;

    expect(() => {
      yaml.load(yamlString);
    }).toThrow();
  });

  it('定義前のanchorを参照するとエラーになる', () => {
    const yamlString = `
form:
  email:
    <<: *field_base
    type: email

# anchorが後で定義されている
_field_base: &field_base
  required: true
`;

    expect(() => {
      yaml.load(yamlString);
    }).toThrow();
  });
});
