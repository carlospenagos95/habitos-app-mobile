# Genera los íconos de la app (SPEC 05): gato calicó tierno, vectorial plano, sobre azul cielo.
# Dibuja a 4x y reduce para antialiasing. Las formas se construyen como máscaras suavizadas
# (blur + umbral) para lograr contornos curvos en vez de polígonos. Requiere Pillow.
# Uso: python scripts/gen-cat-icons.py
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

OUT_DIR = Path(__file__).resolve().parent.parent / 'assets' / 'images'

S = 4  # supersampling
BASE = 1024  # espacio de coordenadas del dibujo
W = BASE * S

SKY = '#87CEEB'
SKY_PAW = '#A6DCF1'
CREAM = '#FCF6EC'
ORANGE = '#E08A3C'
GRAY = '#6B5E5A'
EYE = '#A8C94A'
COLLAR = '#7B3F8C'
COLLAR_PAW = '#D9A8D6'
TAG = '#E9C46A'
OUTLINE = '#2B2522'
PINK = '#F2B3A0'
BLUSH = (242, 140, 150, 150)
NOSE = '#E27D7D'

LINE = 12  # grosor de contorno en coordenadas base

# Geometría en coordenadas base (1024). El lado derecho se refleja del izquierdo.
CRANIUM = (285, 215, 739, 660)
CHEEKS = (232, 405, 792, 728)
LEFT_EAR = [(268, 405), (292, 112), (478, 250)]
LEFT_EAR_IN = [(312, 345), (322, 178), (432, 262)]
COLLAR_BOX = (322, 676, 702, 766)
TAG_CENTER, TAG_R = (512, 782), 30
EYE_Y, EYE_DX, EYE_R = 478, 110, 64
BLUSH_BOX = (300, 556, 392, 600)


def s(v):
    return round(v * S)


def pts(points):
    return [(s(x), s(y)) for x, y in points]


def box(b):
    return tuple(s(v) for v in b)


def mirror(points):
    return [(BASE - x, y) for x, y in points]


def mirror_box(b):
    return (BASE - b[2], b[1], BASE - b[0], b[3])


def new_layer():
    return Image.new('RGBA', (W, W), (0, 0, 0, 0))


def new_mask():
    return Image.new('L', (W, W), 0)


def smooth(mask, radius):
    """Redondea esquinas y uniones de una máscara binaria."""
    return mask.filter(ImageFilter.GaussianBlur(s(radius))).point(lambda v: 255 if v > 127 else 0)


def grow(mask, amount):
    """Expande la máscara ~amount px base (para contornos por fuera)."""
    return mask.filter(ImageFilter.GaussianBlur(s(amount) / 2)).point(lambda v: 255 if v > 6 else 0)


def fill(img, mask, color):
    layer = Image.new('RGBA', (W, W), color)
    layer.putalpha(ImageChops.multiply(layer.getchannel('A'), mask))
    img.alpha_composite(layer)


def poly_mask(points, round_radius=0):
    m = new_mask()
    ImageDraw.Draw(m).polygon(pts(points), fill=255)
    return smooth(m, round_radius) if round_radius else m


def ellipse_mask(b):
    m = new_mask()
    ImageDraw.Draw(m).ellipse(box(b), fill=255)
    return m


def head_mask():
    return smooth(ImageChops.lighter(ellipse_mask(CRANIUM), ellipse_mask(CHEEKS)), 40)


def ear_masks():
    return poly_mask(LEFT_EAR, 26), poly_mask(mirror(LEFT_EAR), 26)


def collar_mask():
    m = new_mask()
    d = ImageDraw.Draw(m)
    d.rounded_rectangle(box(COLLAR_BOX), radius=s(45), fill=255)
    return m


def tag_mask():
    cx, cy = TAG_CENTER
    return ellipse_mask((cx - TAG_R, cy - TAG_R, cx + TAG_R, cy + TAG_R))


def eye_centers():
    return [(512 - EYE_DX, EYE_Y), (512 + EYE_DX, EYE_Y)]


def draw_paw(d, cx, cy, r, color):
    d.ellipse(box((cx - r, cy - r * 0.55, cx + r, cy + r * 0.95)), fill=color)
    for dx, dy in [(-1.05, -1.0), (-0.38, -1.5), (0.38, -1.5), (1.05, -1.0)]:
        tx, ty, tr = cx + dx * r, cy + dy * r, r * 0.38
        d.ellipse(box((tx - tr, ty - tr * 1.2, tx + tr, ty + tr * 1.2)), fill=color)


def draw_eyes(img):
    d = ImageDraw.Draw(img)
    for cx, cy in eye_centers():
        r = EYE_R
        d.ellipse(box((cx - r, cy - r, cx + r, cy + r)), fill=EYE, outline=OUTLINE, width=s(10))
        d.ellipse(box((cx - 40, cy - 46, cx + 40, cy + 48)), fill=OUTLINE)
        # Brillos: uno grande arriba y uno chico abajo, ambos hacia la derecha.
        d.ellipse(box((cx + 2, cy - 42, cx + 32, cy - 12)), fill='white')
        d.ellipse(box((cx - 26, cy + 14, cx - 12, cy + 28)), fill='white')


def draw_cat():
    """Devuelve el gato completo sobre fondo transparente (W x W)."""
    img = new_layer()
    head = head_mask()
    left_ear, right_ear = ear_masks()

    # Collar y placa detrás del mentón.
    fill(img, grow(tag_mask(), LINE), OUTLINE)
    fill(img, tag_mask(), TAG)
    fill(img, grow(collar_mask(), LINE), OUTLINE)
    fill(img, collar_mask(), COLLAR)
    d = ImageDraw.Draw(img)
    for i, cx in enumerate(range(372, 680, 76)):
        draw_paw(d, cx, 730 if i % 2 else 722, 12, COLLAR_PAW)

    # Orejas: izquierda gris, derecha naranja, interior rosa.
    fill(img, grow(ImageChops.lighter(left_ear, right_ear), LINE), OUTLINE)
    fill(img, left_ear, GRAY)
    fill(img, right_ear, ORANGE)
    fill(img, poly_mask(LEFT_EAR_IN, 18), PINK)
    fill(img, poly_mask(mirror(LEFT_EAR_IN), 18), PINK)

    # Cabeza crema con manchas calicó recortadas al contorno.
    fill(img, grow(head, LINE), OUTLINE)
    fill(img, head, CREAM)
    gray_patch = smooth(ImageChops.lighter(ellipse_mask((160, 170, 450, 520)), ellipse_mask((200, 380, 330, 560))), 30)
    fill(img, ImageChops.multiply(gray_patch, head), GRAY)
    orange_patch = poly_mask([(540, 180), (840, 180), (840, 560), (720, 520), (620, 420), (560, 320)], 40)
    fill(img, ImageChops.multiply(orange_patch, head), ORANGE)
    fill(img, ImageChops.multiply(ellipse_mask((700, 430, 820, 540)), head), GRAY)
    blaze = poly_mask([(492, 200), (532, 200), (578, 560), (446, 560)], 30)
    fill(img, ImageChops.multiply(blaze, head), CREAM)

    draw_eyes(img)

    # Mejillas sonrosadas.
    blush = new_layer()
    bd = ImageDraw.Draw(blush)
    bd.ellipse(box(BLUSH_BOX), fill=BLUSH)
    bd.ellipse(box(mirror_box(BLUSH_BOX)), fill=BLUSH)
    img.alpha_composite(blush)

    # Nariz de corazón, sonrisa "w" y bigotes suaves.
    nose = smooth(ImageChops.lighter(
        ImageChops.lighter(ellipse_mask((484, 560, 516, 588)), ellipse_mask((508, 560, 540, 588))),
        poly_mask([(486, 578), (538, 578), (512, 604)])), 4)
    fill(img, grow(nose, 5), OUTLINE)
    fill(img, nose, NOSE)
    d = ImageDraw.Draw(img)
    d.line(pts([(512, 604), (512, 626)]), fill=OUTLINE, width=s(8))
    d.arc(box((452, 580, 514, 660)), 10, 170, fill=OUTLINE, width=s(9))
    d.arc(box((510, 580, 572, 660)), 10, 170, fill=OUTLINE, width=s(9))
    for side in (-1, 1):
        for y_in, y_out in [(572, 530), (590, 568), (608, 606), (626, 644)]:
            d.line(pts([(512 + side * 160, y_in), (512 + side * 300, y_out)]), fill=OUTLINE, width=s(6))
    return img


def silhouette_mask(with_collar=True, face_holes=False):
    left_ear, right_ear = ear_masks()
    m = ImageChops.lighter(head_mask(), ImageChops.lighter(left_ear, right_ear))
    if with_collar:
        m = ImageChops.lighter(m, ImageChops.lighter(collar_mask(), tag_mask()))
    if face_holes:
        d = ImageDraw.Draw(m)
        for cx, cy in eye_centers():
            r = EYE_R - 8
            d.ellipse(box((cx - r, cy - r, cx + r, cy + r)), fill=0)
            # Brillo relleno para que el hueco lea como ojo tierno y no como calavera.
            d.ellipse(box((cx - 2, cy - 40, cx + 34, cy - 4)), fill=255)
        d.ellipse(box((484, 560, 516, 588)), fill=0)
        d.ellipse(box((508, 560, 540, 588)), fill=0)
        d.polygon(pts([(486, 578), (538, 578), (512, 604)]), fill=0)
    return m


def solid_from_mask(mask, color='white'):
    img = Image.new('RGBA', (W, W), color)
    img.putalpha(mask)
    return img


def background():
    img = Image.new('RGBA', (W, W), SKY)
    step = 170
    for row, y in enumerate(range(40, BASE + step, step)):
        offset = step / 2 if row % 2 else 0
        for col, x in enumerate(range(0, BASE + step, step)):
            paw = Image.new('RGBA', (s(300), s(300)), (0, 0, 0, 0))
            draw_paw(ImageDraw.Draw(paw), 150, 150, 26, SKY_PAW)
            paw = paw.rotate(20 if (row + col) % 2 else -20, resample=Image.BICUBIC)
            img.alpha_composite(paw, (s(x + offset - 150), s(y - 150)))
    return img


def fit(content, height_ratio, size=BASE):
    """Recorta al contenido, escala a height_ratio del lienzo y centra. Devuelve size x size."""
    cropped = content.crop(content.getbbox())
    target_h = round(W * height_ratio)
    target_w = round(cropped.width * target_h / cropped.height)
    cropped = cropped.resize((target_w, target_h), Image.LANCZOS)
    canvas = new_layer()
    canvas.alpha_composite(cropped, ((W - target_w) // 2, (W - target_h) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cat = draw_cat()

    bg = background().resize((BASE, BASE), Image.LANCZOS)
    icon = bg.copy()
    icon.alpha_composite(fit(cat, 0.74))

    outputs = {
        'icon.png': icon.convert('RGB'),
        'android-icon-foreground.png': fit(cat, 0.58),
        'android-icon-background.png': bg.convert('RGB'),
        'android-icon-monochrome.png': fit(solid_from_mask(silhouette_mask(face_holes=True)), 0.58),
        'splash-icon.png': fit(cat, 0.9),
        'notification-icon.png': fit(solid_from_mask(silhouette_mask(False, True)), 0.92, 96),
        'favicon.png': icon.convert('RGB').resize((48, 48), Image.LANCZOS),
    }
    for name, img in outputs.items():
        img.save(OUT_DIR / name)
        print(f'{name}: {img.size[0]}x{img.size[1]}')


if __name__ == '__main__':
    main()
