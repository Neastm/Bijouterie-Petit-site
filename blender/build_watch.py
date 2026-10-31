"""Parametric PRX study, based on the reference supplied by the client.
Run with Blender 4.5+: blender -b --factory-startup --python blender/build_watch.py
Geometry uses millimetre-inspired units: 40 mm case = 4 scene units.
"""
import bpy, math, os, json
from mathutils import Vector
from math import sin, cos, pi

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'dist','assets')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def material(name,color,metal=0,rough=.3):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    return m
steel=material('Acier brosse',(.57,.60,.63),1,.28)
polish=material('Acier poli',(.78,.81,.84),1,.15)
side=material('Acier lateral',(.35,.39,.43),1,.26)
blue=material('Cadran bleu nuit',(.006,.027,.059),.42,.32)
waffle=material('Carres guilloches',(.012,.044,.083),.48,.27)
white=material('SuperLuminova et typographie',(.93,.95,.91),.08,.35)
ink=material('Date noire',(.012,.018,.025),.0,.5)

def loc(p): return (p[0],-p[2],p[1])
def finish(o,name,mat,bevel=0):
    o.name=name; o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Aretes adoucies','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Normales acier','WEIGHTED_NORMAL'); bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def box(name,p,d,mat,bevel=.02,angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc(p)); o=bpy.context.object
    o.dimensions=(d[0],d[2],d[1]); o.rotation_euler[1]=-angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,bevel)
def cyl(name,p,r,depth,mat,verts=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc(p),rotation=(pi/2,0,0))
    return finish(bpy.context.object,name,mat,.012)
def ring(name,r1,r2,z1,z2,mat):
    verts=[]; faces=[]; n=144
    for r,z in [(r1,z1),(r2,z1),(r1,z2),(r2,z2)]:
        verts += [loc((r*cos(2*pi*i/n),r*sin(2*pi*i/n),z)) for i in range(n)]
    for a,b in [(0,1),(2,0),(1,3),(3,2)]:
        for i in range(n):
            j=(i+1)%n; faces.append((a*n+i,a*n+j,b*n+j,b*n+i))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o); finish(o,name,mat)
    for f in mesh.polygons: f.use_smooth=True
    return o
def text(body,p,size,mat,name=None):
    curve=bpy.data.curves.new('Gravure','FONT'); curve.body=body; curve.align_x='CENTER'; curve.align_y='CENTER'
    curve.size=size; curve.extrude=.0008; curve.resolution_u=4
    o=bpy.data.objects.new(name or body,curve); bpy.context.collection.objects.link(o)
    o.location=loc(p); o.rotation_euler=(pi/2,0,0); o.data.materials.append(mat)
    bpy.context.view_layer.objects.active=o; o.select_set(True); bpy.ops.object.convert(target='MESH'); o.select_set(False)
    return o

# Angular tonneau, polished bevel and integrated bracelet shoulders.
outline=[(-1.34,2.12),(1.34,2.12),(1.66,1.65),(1.96,.70),(2.0,0),(1.94,-.73),(1.64,-1.64),(1.30,-2.10),(-1.30,-2.10),(-1.64,-1.64),(-1.94,-.73),(-2.0,0),(-1.96,.70),(-1.66,1.65)]
verts=[loc((x,y,z)) for z in [-.21,.21] for x,y in outline]; n=len(outline)
faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
mesh=bpy.data.meshes.new('Boitier tonneau'); mesh.from_pydata(verts,[],faces); mesh.update()
o=bpy.data.objects.new('Boitier PRX 40 mm',mesh); bpy.context.collection.objects.link(o); finish(o,o.name,steel,.075)
ring('Lunette polie',1.69,1.82,.245,.37,polish)
ring('Joint interieur',1.655,1.695,.28,.325,side)
cyl('Cadran', (0,0,.295),1.66,.035,blue)
# The tiny raised waffle squares are genuine geometry.
for ix in range(-15,16):
    for iy in range(-15,16):
        x=ix*.103; y=iy*.103
        if x*x+y*y<1.59**2 and not (.92<x<1.48 and -.19<y<.19):
            box('Guillochage', (x,y,.321),(.081,.081,.008),waffle,0)
for i in range(60):
    a=2*pi*i/60; big=(i%5==0)
    if i!=15:
        rr=1.43 if big else 1.55
        box('Index heure' if big else 'Minute', (sin(a)*rr,cos(a)*rr,.355 if big else .335),(.063 if big else .018,.29 if big else .075,.045 if big else .009),polish if big else white,.008 if big else .002,-a)
        if big: box('Lumiere index',(sin(a)*rr,cos(a)*rr,.382),(.025,.20,.008),white,.004,-a)
box('Cadre date',(1.17,0,.357),(.43,.33,.045),polish,.018)
box('Fond date',(1.17,0,.385),(.34,.265,.012),white,.006)
text('8',(1.17,-.005,.401),.245,ink)
text('TISSOT',(0,.82,.35),.192,white)
text('1853',(0,.62,.35),.125,white)
text('PRX',(0,-.64,.35),.16,white)
text('POWERMATIC 80',(0,-.84,.35),.079,white)
text('SWISS   MADE',(0,-1.48,.35),.057,white)
# Raised hands, 10:08 as in supplied reference.
for name,a,length,width,z in [('Aiguille heures',-pi/3,1.03,.105,.415),('Aiguille minutes',pi*.265,1.39,.073,.445)]:
    cx=sin(a)*length*.43; cy=cos(a)*length*.43
    box(name,(cx,cy,z),(width,length,.038),polish,.017,-a)
    box(name+' lume',(cx,cy,z+.022),(width*.49,length*.78,.008),white,.007,-a)
box('Trotteuse',(-.21,-.37,.487),(.018,1.85,.018),polish,.004,.53)
cyl('Pivot',(0,0,.50),.085,.045,polish,48)
# Integrated tapering steel links; each has a narrow polished inset.
for sign in [-1,1]:
    for i in range(8):
        yy=sign*(2.03+i*.315); width=2.64-i*.065
        depth=-.05-(i*.035)**2
        o=box('Maillon acier',(0,yy,depth),(width,.293,.25),steel,.025)
        box('Centre maillon',(0,yy-.035*sign,depth+.132),(width*.72,.257,.025),steel,.012)
        box('Reflet maillon',(0,yy-.109*sign,depth+.137),(width-.10,.018,.016),polish,.005)
        box('Joint maillon',(0,yy+.148*sign,depth-.012),(width-.06,.014,.14),side,.005)
# Knurled crown, cylinder axis along X.
bpy.ops.mesh.primitive_cylinder_add(vertices=72,radius=.22,depth=.25,location=loc((2.08,.02,.0)),rotation=(0,pi/2,0)); finish(bpy.context.object,'Couronne',polish,.015)
for i in range(32):
    a=2*pi*i/32
    box('Cannelure couronne',(2.10,.02+sin(a)*.218,cos(a)*.218),(.22,.018,.018),side,.003)

# Save an editable native scene and export the same geometry for the web.
watch=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in watch:o.select_set(True)
bpy.context.view_layer.objects.active=watch[0]
# One mesh per material keeps the website draw count small.
for mat in [steel,polish,side,blue,waffle,white,ink]:
    obs=[o for o in list(bpy.context.scene.objects) if o.type=='MESH' and len(o.data.materials) and o.data.materials[0]==mat]
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:o.select_set(True)
    if obs:
        bpy.context.view_layer.objects.active=obs[0]; bpy.ops.object.join(); bpy.context.object.name=mat.name
bpy.ops.object.empty_add(type='PLAIN_AXES',location=(0,0,0)); rig=bpy.context.object; rig.name='Montre - animation entree et sortie'
for obj in list(bpy.context.scene.objects):
    if obj!=rig: obj.parent=rig
for frame,z,rx,ry in [(1,-12,.22,-.30),(60,0,0,-.12),(110,0,0,-.12),(180,14,-.20,.25)]:
    rig.location.z=z;rig.rotation_euler=(rx,0,ry);rig.keyframe_insert(data_path='location',frame=frame);rig.keyframe_insert(data_path='rotation_euler',frame=frame)
bpy.context.scene.frame_end=180;bpy.context.scene.render.fps=30;bpy.context.scene.frame_set(85)
# Keep the website neutral pose: browser controls the responsive scroll timeline.
rig.location=(0,0,0);rig.rotation_euler=(0,0,0)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'petit-prx.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)
bpy.context.scene.frame_set(85)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            from mathutils import Quaternion
            area.spaces.active.region_3d.view_distance=12
            area.spaces.active.region_3d.view_rotation=Quaternion((1,0,0),pi/2)
            area.spaces.active.shading.type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','Petit-PRX.blend'),compress=True)
print('PETIT_WATCH_EXPORTED',len(bpy.context.scene.objects))
