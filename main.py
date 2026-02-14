# -*- coding: utf-8 -*-
import pygame
import random
import time
import asyncio

# =====================
# 初期化
# =====================
pygame.init()

WIDTH, HEIGHT = 800, 600
CELL = 40
COLS = WIDTH // CELL
ROWS = HEIGHT // CELL

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Maze Game")
clock = pygame.time.Clock()

WHITE = (255,255,255)
BLACK = (0,0,0)
RED   = (220,60,60)
BLUE  = (80,80,255)
GRAY  = (200,200,200)
GOLD  = (255,215,0)

font = pygame.font.SysFont(None, 28)

# =====================
# 迷路生成
# =====================
def gen_maze(w, h):
    maze = [[1]*w for _ in range(h)]
    stack = [(0,0)]
    maze[0][0] = 0

    while stack:
        x,y = stack[-1]
        dirs = []
        for dx,dy in [(2,0),(-2,0),(0,2),(0,-2)]:
            nx,ny = x+dx, y+dy
            if 0<=nx<w and 0<=ny<h and maze[ny][nx]==1:
                dirs.append((dx,dy))
        if dirs:
            dx,dy = random.choice(dirs)
            maze[y+dy//2][x+dx//2] = 0
            maze[y+dy][x+dx] = 0
            stack.append((x+dx,y+dy))
        else:
            stack.pop()
    return maze

# =====================
# ゲーム初期化
# =====================
def reset_game():
    global maze, px, py, goal, start_time, goal_time, finished
    maze = gen_maze(COLS, ROWS)
    px = py = 0
    goal = (COLS-1, ROWS-1)
    maze[goal[1]][goal[0]] = 0  # ゴールは必ず通路

    start_time = None
    goal_time = 0
    finished = False

best_time = None
retry_rect = pygame.Rect(WIDTH//2-80, HEIGHT-50, 160, 35)

reset_game()

# =====================
# メインループ（pygbag用）
# =====================
async def main():
    global px, py, start_time, finished, best_time, goal_time

    while True:
        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                return  # Webでは quit / exit 禁止

            if e.type == pygame.KEYDOWN and not finished:
                if start_time is None:
                    start_time = time.time()

                dx = dy = 0
                if e.key == pygame.K_UP:    dy = -1
                if e.key == pygame.K_DOWN:  dy = 1
                if e.key == pygame.K_LEFT:  dx = -1
                if e.key == pygame.K_RIGHT: dx = 1

                nx, ny = px+dx, py+dy
                if 0<=nx<COLS and 0<=ny<ROWS and maze[ny][nx]==0:
                    px, py = nx, ny

            if e.type == pygame.MOUSEBUTTONDOWN and finished:
                if retry_rect.collidepoint(e.pos):
                    reset_game()

        # ゴール判定
        if not finished and (px, py) == goal:
            finished = True
            goal_time = time.time() - start_time
            if best_time is None or goal_time < best_time:
                best_time = goal_time

        # =====================
        # 描画
        # =====================
        screen.fill(WHITE)

        for y in range(ROWS):
            for x in range(COLS):
                if maze[y][x]:
                    pygame.draw.rect(
                        screen, BLACK,
                        (x*CELL, y*CELL, CELL, CELL)
                    )

        # ゴール
        pygame.draw.rect(
            screen, RED,
            (goal[0]*CELL, goal[1]*CELL, CELL, CELL)
        )

        # プレイヤー
        pygame.draw.circle(
            screen, BLUE,
            (px*CELL + CELL//2, py*CELL + CELL//2),
            CELL//3
        )

        # タイマー表示
        t = (time.time()-start_time) if start_time and not finished else goal_time
        screen.blit(font.render(f"TIME: {t:.1f}s", True, BLACK), (10,10))

        if best_time:
            screen.blit(font.render(f"BEST: {best_time:.1f}s", True, GOLD), (10,40))

        # もう一回ボタン
        if finished:
            pygame.draw.rect(screen, GRAY, retry_rect)
            pygame.draw.rect(screen, BLACK, retry_rect, 2)
            txt = font.render("もう一回", True, BLACK)
            screen.blit(
                txt,
                (retry_rect.centerx - txt.get_width()//2,
                 retry_rect.centery - txt.get_height()//2)
            )

        pygame.display.flip()
        clock.tick(30)

        # ★ pygbag 必須
        await asyncio.sleep(0)

# =====================
# pygbag エントリーポイント
# =====================
import pygbag.aio as aio
aio.run(main())
