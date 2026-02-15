import pygame
import sys

pygame.init()
screen = pygame.display.set_mode((640, 480))
pygame.display.set_caption("pygbag test")

clock = pygame.time.Clock()
font = pygame.font.SysFont(None, 48)

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    screen.fill((30, 30, 30))
    text = font.render("HELLO PYGAME WEB", True, (255, 255, 255))
    screen.blit(text, (50, 200))

    pygame.display.flip()
    clock.tick(60)
