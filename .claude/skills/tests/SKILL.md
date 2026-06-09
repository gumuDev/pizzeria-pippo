# .claude/skills/tests/SKILL.md

1. Leer el plan de tests desde la ruta definida en CLAUDE.md
2. Validar el estado actual — qué tests existen, qué está roto, qué falta
3. Crear plan para el módulo de tests que se va a implementar, guardarlo en `pippo-project/tests/plans/` con un nombre descriptivo (ej: `2024-06-15-new-feature-tests.md`)
4. Pedir validación del usuario antes de escribir código
5. Implementar UN archivo/módulo de test a la vez
6. Después de cada módulo, correr solo esos tests y corregir errores
7. Pedir validación del usuario antes de continuar
8. Al final, correr toda la suite para verificar que nada se rompió
9. Los tests solo el usuario los ejecuta — no deben correr automáticamente en ningún momento
10. Eliminar cualquier test que ya no sea relevante o que esté duplicado
11. Los tests deben ser independientes y no tener dependencias entre sí