---
slug: "test-article-category-1"
title: "【テスト記事】カテゴリ1: 初心者向けガイド"
author: "Test Author"
publishedAt: "2025-12-01"
category: "Claude Best Practices"
tags: ["guide", "beginner"]
description: "E2Eテスト専用記事: カテゴリ1とタグ2つの組み合わせテスト用"
testOnly: true
---

# テスト記事: カテゴリ1

この記事はE2Eテスト専用です。本番環境では表示されません。

## 用途

- カテゴリ「Claude Best Practices」のフィルタテスト
- タグ「guide」「beginner」のフィルタテスト
- 複合フィルタ（カテゴリ + タグ）のテスト

## テストシナリオ

1. カテゴリ1で絞り込んだ時、この記事が表示される
2. タグ「guide」で絞り込んだ時、この記事が表示される
3. タグ「beginner」で絞り込んだ時、この記事が表示される
4. タグ「guide」AND「beginner」で絞り込んだ時、この記事が表示される
