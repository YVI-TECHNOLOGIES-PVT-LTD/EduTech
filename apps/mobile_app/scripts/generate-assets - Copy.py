import os
import zlib
import struct

def make_png(width, height, color):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type None
        for x in range(width):
            raw_data.extend(color)  # RGBA
    
    compressed = zlib.compress(bytes(raw_data))
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

out_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'images')
os.makedirs(out_dir, exist_ok=True)

# Generate EduTrack Blue PNG Assets
with open(os.path.join(out_dir, 'icon.png'), 'wb') as f:
    f.write(make_png(1024, 1024, (2, 132, 199, 255)))

with open(os.path.join(out_dir, 'adaptive-icon.png'), 'wb') as f:
    f.write(make_png(1024, 1024, (2, 132, 199, 255)))

with open(os.path.join(out_dir, 'splash.png'), 'wb') as f:
    f.write(make_png(1242, 2436, (15, 23, 42, 255)))

with open(os.path.join(out_dir, 'favicon.png'), 'wb') as f:
    f.write(make_png(48, 48, (2, 132, 199, 255)))

print("Successfully generated icon.png, adaptive-icon.png, splash.png, and favicon.png!")
