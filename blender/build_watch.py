"""Parametric PRX study, based on the reference supplied by the client.
Run with Blender 4.5+: blender -b --factory-startup --python blender/build_watch.py
Geometry uses millimetre-inspired units: 40 mm case = 4 scene units.
"""
import bpy, math, os, json, gzip
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
steel=material('Acier 316L brosse longitudinalement',(.62,.65,.68),1,.31)
polish=material('Acier 316L chanfreins polis miroir',(.83,.85,.88),1,.115)
side=material('Acier 316L flancs satines',(.42,.46,.50),1,.26)
for key in ['Anisotropic IOR Level','Anisotropic']:
    if key in steel.node_tree.nodes.get('Principled BSDF').inputs:
        steel.node_tree.nodes.get('Principled BSDF').inputs[key].default_value=.62
blue=material('Cadran bleu nuit',(.006,.027,.059),.42,.32)
waffle=material('Carres guilloches',(.012,.044,.083),.48,.27)
white=material('SuperLuminova et typographie',(.93,.95,.91),.08,.35)
ink=material('Date noire',(.012,.018,.025),.0,.5)

def loc(p): return (p[0],-p[2],p[1])

def prism(name,outline,z0,z1,mat,bevel=.01,center=(0,0,0),slope=0,angle=0):
    """Single machined piece. Concave stepped outline, satin face, polished bevel."""
    cx,cy,cz=center; verts=[]
    for z in [z0,z1]:
        for x,y in outline:
            xx=x*cos(angle)+y*sin(angle); yy=y*cos(angle)-x*sin(angle)
            verts.append(loc((cx+xx,cy+yy,cz+z+slope*yy)))
    n=len(outline);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    for m in [mat,polish,side]:mesh.materials.append(m)
    for f in mesh.polygons:f.material_index=0 if f.index==1 else 2
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    if bevel:
        mod=o.modifiers.new('Chanfreins polis usines','BEVEL');mod.width=bevel;mod.segments=3;mod.material=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Normales ponderees','WEIGHTED_NORMAL');mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    o.select_set(False);return o

def lathe(name,profile,mat,segments=160):
    verts=[];faces=[]
    for r,z in profile:verts += [loc((r*cos(2*pi*i/segments),r*sin(2*pi*i/segments),z)) for i in range(segments)]
    for row in range(len(profile)-1):
        for i in range(segments):
            j=(i+1)%segments;faces.append((row*segments+i,row*segments+j,(row+1)*segments+j,(row+1)*segments+i))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,mat)
    for f in mesh.polygons:f.use_smooth=True
    return o
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
outline=[(-1.30,1.985),(1.30,1.985),(1.56,1.69),(1.83,1.10),(1.98,.48),(2.0,-.28),(1.82,-1.16),(1.51,-1.75),(1.27,-1.985),(-1.27,-1.985),(-1.51,-1.75),(-1.82,-1.16),(-2.,-.28),(-1.98,.48),(-1.83,1.10),(-1.56,1.69)]
prism('Boitier PRX 40 mm - tonneau et facettes',outline,-.24,.215,steel,.045)
lathe('Lunette polie - profil tourne',[(1.695,.205),(1.805,.21),(1.845,.245),(1.849,.292),(1.826,.330),(1.775,.351),(1.700,.351),(1.669,.332),(1.666,.291),(1.695,.205)],polish)
lathe('Rehaut interieur satine',[(1.625,.30),(1.669,.30),(1.669,.337),(1.642,.337),(1.625,.30)],side)
cyl('Cadran', (0,0,.295),1.66,.035,blue)
# The tiny raised waffle squares are genuine geometry.
for ix in range(-15,16):
    for iy in range(-15,16):
        x=ix*.103; y=iy*.103
        if x*x+y*y<1.59**2 and not (.92<x<1.48 and -.19<y<.19):
            box('Guillochage en relief', (x,y,.314),(.083,.083,.014),waffle,.004)
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
# Tapered sword hands and counterweights, 10:08 as in supplied reference.
for name,a,length,width,z in [('Aiguille heures',-pi/3,1.045,.102,.415),('Aiguille minutes',pi*4/15,1.392,.077,.453)]:
    shape=[(-width*.39,-.165),(-width*.5,.20),(-width*.46,length*.78),(0,length),(width*.46,length*.78),(width*.5,.20),(width*.39,-.165)]
    prism(name,shape,-.013,.013,polish,.003,(0,0,z),angle=a)
    luminous=[(-width*.22,.20),(-width*.20,length*.77),(0,length*.90),(width*.20,length*.77),(width*.22,.20)]
    prism(name+' insert lumineux',luminous,0,.004,white,.001,(0,0,z+.016),angle=a)
prism('Trotteuse effilee',[(-.008,-.33),(-.008,1.53),(0,1.62),(.008,1.53),(.008,-.33)],-.006,.006,polish,.001,(0,0,.491),angle=-2.61)
cyl('Pivot',(0,0,.512),.071,.032,polish,48)
# True single-piece interlocking T links, with matching recess and protruding tongue.
# Shorter bracelet matches the supplied packshot rather than an elongated ladder.
for sign in [-1,1]:
    for i in range(6):
        pitch=.286;yy=sign*(2.075+i*pitch);width=2.74-.080*i
        tongue=width*.50;gap=.013;h=pitch
        shape=[(-width/2,h*.50),(-tongue/2-gap,h*.50),(-tongue/2-gap,h*.30),(tongue/2+gap,h*.30),(tongue/2+gap,h*.50),(width/2,h*.50),(width/2,-h*.45),(tongue/2,-h*.45),(tongue/2,-h*.65),(-tongue/2,-h*.65),(-tongue/2,-h*.45),(-width/2,-h*.45)]
        shape=[(x,-sign*y) for x,y in shape]
        depth=-.010-.023*i*i
        prism('Maillon %s %02d - T usine' % ('haut' if sign>0 else 'bas',i+1),shape,-.148,.115,steel,.016,(0,yy,depth),slope=-sign*.046*i)
    end=[(-1.365,-.15),(-.76,-.15),(-.76,.11),(.76,.11),(.76,-.15),(1.365,-.15),(1.33,.19),(-1.33,.19)]
    end=[(x,sign*y) for x,y in end]
    prism('End-link ajuste aux epaules '+str(sign),end,-.13,.105,steel,.013,(0,sign*1.86,-.02))
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
# Separate material groups first, retaining polished bevels instead of overwriting them.
for obj in list(bpy.context.scene.objects):
    if obj.type=='MESH' and len(obj.data.materials)>1:
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj;bpy.ops.mesh.separate(type='MATERIAL')
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
with open(os.path.join(OUT,'petit-prx.glb'),'rb') as src,gzip.open(os.path.join(OUT,'petit-prx.glb.gz'),'wb',compresslevel=9) as dst:
    dst.write(src.read())
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
