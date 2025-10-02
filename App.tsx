import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { GoogleGenAI, Chat, Content } from "@google/genai";
import { GeneratedImage, PromptTemplateCategory, GenerationBatch, PromptTemplate, AdvisorPersona, ChatMessage } from './types';
import { toBase64 } from './utils/imageUtils';
import { generateImage, generateTextResponse } from './services/geminiService';
import { Button } from './components/Button';
import { IconUpload, IconSparkles, IconOptions, IconDownload, IconCamera, IconX, IconPlus, IconPhoto, IconBell, IconUserCircle, IconLogo, IconCheck, IconGlobe, IconCrown, IconChevronDown, IconGoogle, IconApple, IconViewLarge, IconViewMedium, IconViewSmall, IconTrash } from './components/Icons';
import { ALL_ADVISORS, ROOM_TYPES, ITEM_TYPES, BUILDING_TYPES } from './constants';
import { useTranslation } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { LANGUAGES } from './constants/languages';
import { PricingPage } from './components/PricingPage';
import { BlogPage } from './components/BlogPage';
import { FreeCanvasPage, MyDesignsSidebar } from './components/FreeCanvasPage';
import { AdminPage } from './components/admin/AdminPage';
import { AuthPage } from './components/AuthPage';
import { StaticPage } from './components/StaticPage';
import { UserInfoBar } from './components/UserInfoBar';
import { SubscriptionManagePage } from './components/SubscriptionManagePage';
import { useTemplatesByRoomType, useTemplatesByCategory, useAllTemplates } from './hooks/useTemplatesByRoomType';
import { useRoomTypes } from './hooks/useRoomTypes';
import { useStyleCategories } from './hooks/useStyleCategories';
import { useFeaturePageTemplates } from './hooks/useFeaturePageTemplates';
import { useActiveFeatures } from './hooks/useActiveFeatures';

// --- Re-styled Helper Components ---

const PromptTemplates: React.FC<{
    categories: PromptTemplateCategory[];
    onTemplateSelect: (templateId: string) => void;
    selectedTemplateIds: string[];
}> = ({ categories, onTemplateSelect, selectedTemplateIds }) => {
    const { t } = useTranslation();
    const SELECTION_LIMIT = 9;

    return (
        <div className="space-y-6">
            {categories.map(category => (
                <div key={category.name}>
                    <h2 className="text-base font-semibold text-slate-700 mb-3">{category.name}</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {category.templates.map((template) => {
                            const isSelected = selectedTemplateIds.includes(template.id);
                            const limitReached = selectedTemplateIds.length >= SELECTION_LIMIT;
                            const isDisabled = !isSelected && limitReached;

                            return (
                                <div
                                    key={template.id}
                                    onClick={() => !isDisabled && onTemplateSelect(template.id)}
                                    className={`group ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                    <div className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-slate-100 transition-all duration-300 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 group-hover:border-indigo-400'}`}>
                                        <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-indigo-700/60 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                                    <IconCheck className="w-5 h-5 text-indigo-600" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-center text-xs mt-2 font-medium transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`}>{template.name}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};


const PhotoDisplay: React.FC<{
    era: string;
    imageUrl: string;
    onDownload: (imageUrl: string, era: string) => void;
    onRegenerate: () => void;
    onImageClick: (imageUrl: string) => void;
    onDragStart: (e: React.DragEvent<HTMLImageElement>) => void;
}> = ({ era, imageUrl, onDownload, onRegenerate, onImageClick, onDragStart }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='relative group'
        >
            <div className="rounded-lg overflow-hidden cursor-grab aspect-square" onClick={() => onImageClick(imageUrl)}>
                <img src={imageUrl} alt={`Generated image: ${era}`} className="w-full h-full object-cover" draggable="true" onDragStart={onDragStart} />
            </div>
            
            <div className="absolute top-3 right-3 z-10" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-full bg-white/60 text-slate-800 hover:bg-white/90 transition-colors backdrop-blur-sm shadow-lg"
                    aria-label="Options"
                >
                    <IconOptions />
                </button>

                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-12 mt-2 w-48 origin-top-right bg-white backdrop-blur-md rounded-lg shadow-2xl ring-1 ring-black/5 text-slate-700 text-sm flex flex-col p-1"
                    >
                        <button onClick={() => { onRegenerate(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md transition-colors">{t('results.regenerate')}</button>
                        <button onClick={() => { onDownload(imageUrl, era); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md transition-colors">{t('results.download')}</button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

const SkeletonLoader: React.FC<{className?: string}> = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`}></div>
);

const LoadingCard: React.FC = () => (
    <div className="relative bg-slate-100 rounded-lg shadow-sm overflow-hidden animate-pulse">
        <div className="aspect-square bg-slate-200"></div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    </div>
);


const ErrorCard: React.FC<{ onRegenerate?: () => void; }> = ({ onRegenerate }) => {
    const { t } = useTranslation();
    return (
        <div className="aspect-square flex flex-col items-center justify-center text-center p-4 rounded-lg bg-red-50 border-2 border-dashed border-red-300">
            <p className="text-red-600 font-medium mb-4">{t('results.generationFailed')}</p>
            {onRegenerate && <Button onClick={onRegenerate} primary>{t('results.retry')}</Button>}
        </div>
    );
}

const ErrorNotification: React.FC<{message: string | null; onDismiss: () => void}> = ({ message, onDismiss }) => {
    if (!message) return null;
    return (
        <div className="fixed top-5 left-1/2 z-50 w-full max-w-md p-4 bg-white border border-slate-200 text-slate-800 rounded-lg shadow-2xl flex items-center justify-between animate-fade-in-down" style={{transform: 'translateX(-50%)'}}>
            <span>{message}</span>
            <button onClick={onDismiss} className="p-1 rounded-full hover:bg-slate-100 transition-colors ml-4">
                <IconX/>
            </button>
        </div>
    );
};

const CameraModal: React.FC<{
    isOpen: boolean; 
    onClose: () => void; 
    onCapture: (imageDataUrl: string) => void;
}> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const { t } = useTranslation();

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (videoRef.current) {
            setCameraError(null);
            try {
                stopCamera();
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1024 }, height: { ideal: 1024 }, facingMode: 'user' }
                });
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            } catch (err) {
                console.error("Error accessing camera:", err);
                setCameraError(t('camera.error'));
            }
        }
    }, [stopCamera, t]);

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, capturedImage, startCamera, stopCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.scale(-1, 1);
            context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            setCapturedImage(null);
            onClose();
        }
    };

    const handleRetake = () => setCapturedImage(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl w-full max-w-2xl text-center relative"
             >
                <h3 className="text-2xl font-semibold mb-4 text-slate-900">{t('camera.title')}</h3>
                <div className="aspect-square bg-slate-200 rounded-lg overflow-hidden relative mb-4 flex items-center justify-center">
                    {cameraError ? <div className="p-4 text-red-500">{cameraError}</div> : (
                        <>
                            {capturedImage ? 
                                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" /> : 
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                            }
                        </>
                    )}
                </div>

                <div className="flex justify-center gap-4">
                    {capturedImage ? (
                        <>
                            <Button onClick={handleRetake}>{t('camera.retake')}</Button>
                            <Button onClick={handleConfirm} primary>{t('camera.usePhoto')}</Button>
                        </>
                    ) : (
                         <button onClick={handleCapture} disabled={!!cameraError} className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"></button>
                    )}
                </div>
                
                <button onClick={() => { setCapturedImage(null); onClose(); }} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"><IconX /></button>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </motion.div>
        </div>
    );
};

const ImageViewerModal: React.FC<{ imageUrl: string | null; onClose: () => void; }> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative"
                onClick={(e) => e.stopPropagation()} 
            >
                <img src={imageUrl} alt="Full screen view" className="block max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                <button onClick={onClose} className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-800 hover:bg-slate-200 transition-colors border border-slate-200" aria-label="Close image viewer"><IconX /></button>
            </motion.div>
        </div>
    );
};

const ImageUploader: React.FC<{
  title: string;
  description: string;
  imageUrl: string | null;
  isUploading: boolean;
  onFileSelect: () => void;
  onRemove: () => void;
  onImageClick: (imageUrl: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ title, description, imageUrl, isUploading, onFileSelect, onRemove, onImageClick, onDrop }) => {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDrop(e);
    };

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            <div
                className={`aspect-square w-full bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed relative group hover:border-indigo-400/70 transition-colors ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'}`}
                onClick={() => {
                    if (imageUrl) {
                        onImageClick(imageUrl);
                    } else if (!isUploading) {
                        onFileSelect();
                    }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isUploading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                ) : imageUrl ? (
                    <>
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-md" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            aria-label={`Remove image`}
                        >
                            <IconX />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-slate-400 p-4 text-center">
                        <IconUpload />
                        <span className="text-sm mt-2 font-medium">{t('generate.upload')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const MultiItemUploader: React.FC<{
  images: (string | null)[];
  isUploadingSlots: Record<string, boolean>;
  onFileSelect: (index: number) => void;
  onRemove: (index: number) => void;
}> = ({ images, isUploadingSlots, onFileSelect, onRemove }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-lg font-semibold text-slate-800">{t('generate.multiItemUploaderTitle')}</h3>
                <p className="text-sm text-slate-500">{t('generate.multiItemUploaderDesc')}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {images.map((imageUrl, index) => {
                    const isUploading = !!isUploadingSlots[`multi-${index}`];
                    return (
                        <div
                            key={index}
                            className="aspect-square w-full bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 relative group cursor-pointer hover:border-indigo-400/70 transition-colors"
                            onClick={() => !imageUrl && !isUploading && onFileSelect(index)}
                        >
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                            ) : imageUrl ? (
                                <>
                                    <img src={`Item ${index + 1}`} alt={`Item ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        aria-label={`Remove item ${index + 1}`}
                                    >
                                        <IconX />
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 p-2 text-center">
                                    <IconPlus />
                                    <span className="text-xs mt-1 font-medium">{t('generate.add')}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- New Page/Layout Components ---

const LanguageMenu: React.FC<{ onLanguageSelect: (code: string) => void; currentLanguage: string; }> = ({ onLanguageSelect, currentLanguage }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-full mt-3 w-56 max-h-96 overflow-y-auto scrollbar-hide origin-top-right bg-white rounded-lg shadow-2xl ring-1 ring-black/5 text-slate-800 text-sm flex flex-col p-2"
    >
        {LANGUAGES.map(lang => (
            <button
                key={lang.code}
                onClick={() => onLanguageSelect(lang.code)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 ${currentLanguage === lang.code ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100'}`}
            >
                <img src={`https://flagcdn.com/w20/${lang.countryCode}.png`} alt={`${lang.name} flag`} className="w-5 h-auto rounded-sm" />
                <span>{lang.name}</span>
            </button>
        ))}
    </motion.div>
);

const DesignToolsMenu: React.FC<{
    onNavigate: (page: string) => void;
    activeItem: string;
    designTools: { key: string; label: string; }[];
}> = ({ onNavigate, activeItem, designTools }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full mt-3 w-64 origin-top-left bg-white rounded-lg shadow-2xl ring-1 ring-black/5 text-slate-800 text-sm flex flex-col p-2"
        >
            {designTools.map(item => (
                <button
                    key={item.key}
                    onClick={() => onNavigate(item.label)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 ${activeItem === item.label ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100'}`}
                >
                    <span>{item.label}</span>
                </button>
            ))}
        </motion.div>
    );
};


const Header: React.FC<{
    activeItem: string;
    onNavigate: (page: string) => void;
    user: { email: string } | null;
    onLoginClick: () => void;
    onLogout: () => void;
}> = ({ activeItem, onNavigate, user, onLoginClick, onLogout }) => {
    const { t, language, setLanguage } = useTranslation();
    
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [designToolsOpen, setDesignToolsOpen] = useState(false);

    const notificationsRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const designToolsRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
          setNotificationsOpen(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
          setUserMenuOpen(false);
        }
        if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
            setLangMenuOpen(false);
        }
        if (designToolsRef.current && !designToolsRef.current.contains(event.target as Node)) {
            setDesignToolsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    // Load active features from database
    const { activeFeatures } = useActiveFeatures();

    // Mapping from frontend keys to database page_keys
    const featureKeyMap: Record<string, string> = {
        'interiorDesign': 'interior-design',
        'festiveDecor': 'festive-decor',
        'exteriorDesign': 'exterior-design',
        'itemReplace': 'item-replace',
        'wallPaint': 'wall-paint',
        'floorStyle': 'floor-style',
        'gardenBackyard': 'garden-backyard',
        'styleMatch': 'reference-style',
        'aiAdvisor': 'ai-advisor',
        'multiItemPreview': 'multi-item',
        'freeCanvas': 'free-canvas',
    };

    const designTools = useMemo(() => {
        const allTools = [
            { key: 'interiorDesign', label: t('header.nav.interiorDesign') },
            { key: 'festiveDecor', label: t('header.nav.festiveDecor') },
            { key: 'exteriorDesign', label: t('header.nav.exteriorDesign') },
            { key: 'itemReplace', label: t('header.nav.itemReplace') },
            { key: 'wallPaint', label: t('header.nav.wallPaint') },
            { key: 'floorStyle', label: t('header.nav.floorStyle') },
            { key: 'gardenBackyard', label: t('header.nav.gardenBackyard') },
            { key: 'styleMatch', label: t('header.nav.styleMatch') },
            { key: 'aiAdvisor', label: t('header.nav.aiAdvisor') },
            { key: 'multiItemPreview', label: t('header.nav.multiItemPreview') },
            { key: 'freeCanvas', label: t('header.nav.freeCanvas') },
        ];
        
        // Filter based on active features from database
        return allTools.filter(tool => {
            const dbKey = featureKeyMap[tool.key];
            return activeFeatures.includes(dbKey);
        });
    }, [t, activeFeatures]);

    const designToolLabels = useMemo(() => designTools.map(item => item.label), [designTools]);
    const isDesignToolActive = useMemo(() => designToolLabels.includes(activeItem), [designToolLabels, activeItem]);
    const activeDesignToolLabel = isDesignToolActive ? activeItem : t('header.nav.interiorDesign');


    return (
        <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex-shrink-0 z-40">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <IconLogo />
                    <span className="text-xl font-bold text-slate-800">{t('header.photostudio')}</span>
                </div>
                <nav className="hidden md:flex items-center gap-2">
                    <a 
                       key='explore' 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); onNavigate(t('header.nav.explore')); }}
                       className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${activeItem === t('header.nav.explore') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                       {t('header.nav.explore')}
                       {activeItem === t('header.nav.explore') && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                    </a>

                    <div className="relative" ref={designToolsRef}>
                        <button
                            onClick={() => setDesignToolsOpen(o => !o)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative flex items-center gap-1.5 ${isDesignToolActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <span>{activeDesignToolLabel}</span>
                            <IconChevronDown className={`w-3 h-3 transition-transform duration-200 ${designToolsOpen ? 'rotate-180' : ''}`} />
                            {isDesignToolActive && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                        </button>
                        <AnimatePresence>
                            {designToolsOpen && <DesignToolsMenu onNavigate={(page) => { onNavigate(page); setDesignToolsOpen(false); }} activeItem={activeItem} designTools={designTools} />}
                        </AnimatePresence>
                    </div>

                    <a 
                       key='myRenders' 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); onNavigate(t('header.nav.myRenders')); }}
                       className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${activeItem === t('header.nav.myRenders') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                       {t('header.nav.myRenders')}
                       {activeItem === t('header.nav.myRenders') && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                    </a>
                     <a 
                       key='term' 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); onNavigate(t('header.nav.term')); }}
                       className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${activeItem === t('header.nav.term') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                       {t('header.nav.term')}
                       {activeItem === t('header.nav.term') && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                    </a>
                     <a 
                       key='pricing' 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); onNavigate(t('header.nav.pricing')); }}
                       className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${activeItem === t('header.nav.pricing') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                       {t('header.nav.pricing')}
                       {activeItem === t('header.nav.pricing') && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                    </a>
                     <a 
                       key='faq' 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); onNavigate(t('header.nav.faq')); }}
                       className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${activeItem === t('header.nav.faq') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                       {t('header.nav.faq')}
                       {activeItem === t('header.nav.faq') && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                    </a>
                     <a 
                       key='blog' 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); onNavigate(t('header.nav.blog')); }}
                       className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${activeItem === t('header.nav.blog') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                       {t('header.nav.blog')}
                       {activeItem === t('header.nav.blog') && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                    </a>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                {/* Language Selector */}
                <div className="relative" ref={langMenuRef}>
                    <button onClick={() => setLangMenuOpen(o => !o)} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        <img src={`https://flagcdn.com/w20/${currentLang.countryCode}.png`} alt={`${currentLang.name} flag`} className="w-5 h-auto rounded-sm" />
                        <span>{currentLang.code.split('-')[0].toUpperCase()}</span>
                        <IconChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    <AnimatePresence>
                        {langMenuOpen && <LanguageMenu onLanguageSelect={(langCode) => { setLanguage(langCode); setLangMenuOpen(false); }} currentLanguage={language} />}
                    </AnimatePresence>
                </div>

                {user ? (
                    // 已登录：显示 UserInfoBar
                    <UserInfoBar onNavigate={onNavigate} />
                ) : (
                    // 未登录：显示 Upgrade 按钮和登录按钮
                    <div className="flex items-center gap-3">
                        <Button primary className="rounded-full !px-4 !py-2 text-sm font-bold" onClick={() => onNavigate(t('header.nav.pricing'))}>
                            <IconCrown className="w-4 h-4 mr-1.5" />
                            <span>{t('header.upgradeToPro')}</span>
                        </Button>
                        <button 
                            onClick={onLoginClick} 
                            className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Login"
                        >
                            <IconUserCircle className="w-8 h-8" />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

const ResultsPlaceholder: React.FC<{isAdvisor?: boolean}> = ({ isAdvisor = false }) => {
    const { t } = useTranslation();

    // FIX: Explicitly type `cardVariants` with `Variants` from framer-motion
    // to ensure correct type inference for the `ease` property in transitions.
    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
                ease: "easeOut",
            }
        })
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            className="w-full h-full flex items-center justify-center p-4"
        >
            <div className="w-full max-w-md text-center flex flex-col items-center">
                <div className="relative w-48 h-40 mb-8 flex items-center justify-center">
                    {/* These are decorative cards */}
                    <motion.div
                        custom={0}
                        variants={cardVariants}
                        className="absolute w-40 h-44 bg-white rounded-lg border border-slate-200 shadow-sm"
                        style={{ rotate: `8deg`, transformOrigin: 'bottom center' }}
                    />
                     <motion.div
                        custom={1}
                        variants={cardVariants}
                        className="absolute w-40 h-44 bg-white rounded-lg border border-slate-200 shadow-md"
                        style={{ rotate: `-5deg`, transformOrigin: 'bottom center' }}
                    />
                    {/* Top card with icon */}
                    <motion.div
                        custom={2}
                        variants={cardVariants}
                        className="absolute w-40 h-44 bg-white rounded-lg border border-slate-300 shadow-lg flex flex-col items-center justify-center p-4"
                    >
                        <IconSparkles className="w-12 h-12 text-indigo-500" />
                        <div className="w-24 h-2 bg-slate-200 rounded-full mt-4"></div>
                        <div className="w-16 h-2 bg-slate-200 rounded-full mt-2"></div>
                    </motion.div>
                </div>

                <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-2xl font-bold text-slate-800"
                >
                    {isAdvisor ? t('results.advisorPlaceholder') : t('results.placeholder')}
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="text-slate-500 mt-2 max-w-sm"
                >
                    {isAdvisor ? t('results.advisorPlaceholderDesc') : t('results.placeholderDesc')}
                </motion.p>
            </div>
        </motion.div>
    );
}

const ExplorePage: React.FC<{ onNavigate: (page: string) => void; exploreTemplates: any[]; exploreLoading: boolean }> = ({ onNavigate, exploreTemplates, exploreLoading }) => {
    const { t } = useTranslation();

    const galleryImages = exploreTemplates.map(template => ({
        src: template.imageUrl,
        alt: t(`promptTemplates.templates.${template.id}` as any) || template.name,
    }));
    
    // Duplicate and shuffle for a richer gallery display
    const shuffledGallery = [...galleryImages, ...galleryImages.slice(0, Math.min(4, galleryImages.length))].sort(() => 0.5 - Math.random());
    
    return (
        <main className="flex-1 overflow-y-auto bg-white text-slate-800 scrollbar-hide">
            {/* Hero Section */}
            <section className="px-4 py-8 md:p-8">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        {/* Left Panel - Before */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative aspect-video rounded-2xl overflow-hidden group border border-slate-200 shadow-xl shadow-slate-200/50"
                        >
                            <img src="https://storage.googleapis.com/aistudio-hosting/misc/before_room.png" alt="Before" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg leading-tight">YOUR SPACE</h2>
                                <p className="text-lg md:text-xl text-white/80 mt-1">UNLIMITED POTENTIAL</p>
                            </div>
                            <div className="absolute top-4 right-4 bg-white/70 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">BEFORE</div>
                        </motion.div>

                        {/* Right Panel - After */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="relative aspect-video rounded-2xl overflow-hidden group border border-slate-200 shadow-xl shadow-slate-200/50"
                        >
                             <img src="https://storage.googleapis.com/aistudio-hosting/templates/interior-japandi.png" alt="After" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                             <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg leading-tight">DESIGN AI</h2>
                                <p className="text-lg md:text-xl text-white/80 mt-1">INSTANT TRANSFORMATION</p>
                            </div>
                             <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">AFTER</div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="text-center pb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Button primary className="text-lg py-3 px-8 transform hover:scale-105 transition-transform" onClick={() => onNavigate(t('header.nav.interiorDesign'))}>
                        <IconSparkles className="w-5 h-5"/>
                        {t('explore.hero.cta')}
                    </Button>
                </motion.div>
            </section>

            {/* Style Gallery Section */}
            <section className="pt-8 pb-16 px-4">
                <div className="container mx-auto max-w-7xl text-center">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold tracking-tight text-slate-900 mb-4"
                    >
                        Style Showcase
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto"
                    >
                        Explore a diverse collection of styles generated by MyNook AI. From modern minimalist to cyberpunk dreams.
                    </motion.p>
                    
                    {exploreLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : shuffledGallery.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-600">No templates available yet. Please add templates in the admin panel.</p>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 1 }}
                            className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
                        >
                            {shuffledGallery.map((img, i) => (
                                 <div
                                    key={i}
                                    className="overflow-hidden rounded-lg group relative break-inside-avoid border border-slate-100"
                                >
                                    <img src={img.src} alt={img.alt} className="w-full h-auto transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <p className="text-white font-semibold text-sm drop-shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">{img.alt}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

             {/* Footer */}
            <footer className="text-center p-8 border-t border-slate-200 text-slate-500">
                <p>{t('explore.footer')}</p>
            </footer>
        </main>
    );
};

const ComingSoonPage: React.FC<{ pageName: string }> = ({ pageName }) => {
    const { t } = useTranslation();
    return (
        <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
                <motion.div initial={{opacity: 0, y:20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
                    <IconLogo />
                </motion.div>
                <motion.h2 initial={{opacity: 0, y:20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.1}} className="mt-6 text-4xl font-bold text-slate-900">{t('comingSoon.title')}</motion.h2>
                <motion.p initial={{opacity: 0, y:20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}} className="text-slate-500 mt-2">{t('comingSoon.subtitle', pageName)}</motion.p>
            </div>
        </div>
    );
};

const MyRendersPage: React.FC<{
    history: GenerationBatch[];
    onNavigate: (page: string) => void;
    onDownload: (imageUrl: string, era: string) => void;
    setFullScreenImage: (url: string | null) => void;
    onDelete: (batchId: string, imageId: string) => void;
}> = ({ history, onNavigate, onDownload, setFullScreenImage, onDelete }) => {
    const [galleryViewSize, setGalleryViewSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
    const { t, language } = useTranslation();

    const imageBatchTypes: GenerationBatch['type'][] = ['style', 'item_replace', 'wall_paint', 'floor_style', 'garden', 'style_match', 'multi_item', 'exterior', 'festive', 'free_canvas'];

    const albumTypes = useMemo(() => {
        const types = new Set(history.filter(b => imageBatchTypes.includes(b.type)).map(batch => batch.type));
        return Array.from(types);
    }, [history]);

    const galleryImages = useMemo(() => {
        const filteredBatches = selectedAlbum === 'all'
            ? history.filter(b => imageBatchTypes.includes(b.type))
            : history.filter(batch => batch.type === selectedAlbum);

        return filteredBatches.flatMap(batch =>
            batch.results
                .filter(result => result.status === 'success' && result.imageUrl)
                .map(result => ({
                    ...result,
                    batchInfo: {
                        type: batch.type,
                        timestamp: batch.timestamp,
                        prompt: batch.prompt,
                        id: batch.id
                    }
                }))
        );
    }, [history, selectedAlbum]);

    const viewSizeClasses = useMemo(() => {
        switch (galleryViewSize) {
            case 'sm': return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8';
            case 'lg': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
            case 'md': default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
        }
    }, [galleryViewSize]);

    if (history.filter(b => imageBatchTypes.includes(b.type) && b.results.some(r => r.status === 'success')).length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                 <div className="p-8 bg-white rounded-full border-2 border-slate-200 mb-6">
                    <IconPhoto className="w-16 h-16 text-slate-400" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">{t('myRenders.noRenders')}</h2>
                <p className="text-slate-500 mt-2 max-w-md">{t('myRenders.noRendersDesc')}</p>
                <Button primary className="mt-6 py-3 px-6" onClick={() => onNavigate(t('header.nav.interiorDesign'))}>
                    <IconSparkles className="w-5 h-5"/>
                    {t('myRenders.startGenerating')}
                </Button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-[280px] bg-white p-4 border-r border-slate-200 flex flex-col overflow-y-auto scrollbar-hide">
                <h2 className="text-lg font-semibold text-slate-800 px-2 pb-4">{t('myRenders.albumsTitle')}</h2>
                <div className="space-y-1">
                    <button 
                        onClick={() => setSelectedAlbum('all')}
                        className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 text-sm font-medium ${selectedAlbum === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <IconPhoto className="w-5 h-5" />
                        <span>{t('myRenders.allDesigns')}</span>
                    </button>
                    {albumTypes.map(albumType => (
                        <button 
                            key={albumType} 
                            onClick={() => setSelectedAlbum(albumType)}
                            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 text-sm font-medium ${selectedAlbum === albumType ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                             <IconSparkles className="w-5 h-5" />
                            <span className="truncate">{t(`myRenders.albumTypes.${albumType}`)}</span>
                        </button>
                    ))}
                </div>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {selectedAlbum === 'all' ? t('myRenders.allDesigns') : t(`myRenders.albumTypes.${selectedAlbum}`)}
                    </h1>
                    <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg">
                        {(['lg', 'md', 'sm'] as const).map(size => (
                           <button 
                                key={size}
                                onClick={() => setGalleryViewSize(size)}
                                className={`p-2 rounded-md transition-colors ${galleryViewSize === size ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
                                aria-label={`${size} view`}
                           >
                                {size === 'lg' && <IconViewLarge className="w-5 h-5" />}
                                {size === 'md' && <IconViewMedium className="w-5 h-5" />}
                                {size === 'sm' && <IconViewSmall className="w-5 h-5" />}
                           </button>
                        ))}
                    </div>
                </div>

                {galleryImages.length > 0 ? (
                     <motion.div
                        key={selectedAlbum + galleryViewSize}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                            }
                        }}
                        className={`grid ${viewSizeClasses} gap-4`}
                    >
                        {galleryImages.map((image, index) => (
                            <motion.div 
                                key={`${image.id}-${index}`}
                                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                                className="relative group aspect-square rounded-lg overflow-hidden bg-slate-200 shadow-sm"
                            >
                                <img 
                                    src={image.imageUrl!} 
                                    alt={image.promptBase} 
                                    className="w-full h-full object-cover cursor-pointer" 
                                    onClick={() => setFullScreenImage(image.imageUrl)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-3 flex flex-col justify-end">
                                    <h4 className="text-white text-sm font-semibold truncate">{image.batchInfo.prompt}</h4>
                                    <p className="text-white/80 text-xs">{t(`myRenders.albumTypes.${image.batchInfo.type}`)}</p>
                                    <p className="text-white/60 text-xs">{image.batchInfo.timestamp.toLocaleDateString(language)}</p>
                                </div>
                                <button 
                                    onClick={() => onDownload(image.imageUrl!, image.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 transform scale-75 group-hover:scale-100 pointer-events-auto"
                                    aria-label="Download"
                                >
                                    <IconDownload />
                                </button>
                                <button
                                    onClick={() => onDelete(image.batchInfo.id, image.id)}
                                    className="absolute bottom-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 transform scale-75 group-hover:scale-100 pointer-events-auto"
                                    aria-label="Delete"
                                >
                                    <IconTrash className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-slate-500">
                        <div className="flex flex-col items-center">
                            <IconPhoto className="w-12 h-12 text-slate-400 mb-4" />
                            <p className="font-semibold">{t('myRenders.noImagesInAlbum')}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};


const getModelInstruction = (promptBase: string): string => promptBase.trim();


// --- New UI Components for Header ---

const NotificationsPanel: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { t } = useTranslation();
    const notifications = [
        { icon: <IconSparkles className="w-5 h-5 text-indigo-500" />, title: t('notifications.items.genCompleteTitle'), description: t('notifications.items.genCompleteDesc'), time: t('notifications.time.minutesAgo', 2) },
        { icon: <IconPhoto className="w-5 h-5 text-blue-500" />, title: t('notifications.items.newTemplateTitle'), description: t('notifications.items.newTemplateDesc'), time: t('notifications.time.hourAgo', 1) },
        { icon: <IconUserCircle className="w-5 h-5 text-slate-400" />, title: t('notifications.items.welcomeTitle'), description: t('notifications.items.welcomeDesc'), time: t('notifications.time.dayAgo', 1) },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 w-80 origin-top-right bg-white rounded-lg shadow-2xl ring-1 ring-black/5 text-slate-800 text-sm flex flex-col"
        >
            <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold">{t('notifications.title')}</h3>
            </div>
            <div className="flex-1 p-2">
                {notifications.map((n, i) => (
                    <div key={i} className="flex gap-3 p-2 rounded-md hover:bg-slate-100">
                        <div className="flex-shrink-0 mt-1">{n.icon}</div>
                        <div>
                            <p className="font-semibold">{n.title}</p>
                            <p className="text-xs text-slate-500">{n.description}</p>
                            <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                        </div>
                    </div>
                ))}
            </div>
             <div className="p-2 border-t border-slate-200">
                <button className="w-full text-center py-2 text-indigo-600 text-xs font-semibold hover:bg-slate-100 rounded-md">
                    {t('notifications.markAllRead')}
                </button>
            </div>
        </motion.div>
    );
};

const UserMenu: React.FC<{ user: { email: string }, onLogout: () => void }> = ({ user, onLogout }) => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 w-64 origin-top-right bg-white rounded-lg shadow-2xl ring-1 ring-black/5 text-slate-800 text-sm flex flex-col p-2"
        >
            <div className="p-2 border-b border-slate-200 mb-2">
                <p className="text-sm font-semibold">{t('auth.signedInAs')}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-md transition-colors">{t('userMenu.myAccount')}</button>
            <button className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-md transition-colors">{t('userMenu.settings')}</button>
            <button onClick={onLogout} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-md transition-colors">{t('userMenu.signOut')}</button>
        </motion.div>
    );
};

const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: (email: string) => void }> = ({ isOpen, onClose, onLogin }) => {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const { t } = useTranslation();
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) onLogin(email);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-2xl w-full max-w-sm text-center relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><IconX /></button>
                <div className="flex items-center justify-center gap-2 mb-6">
                    <IconLogo />
                    <h2 className="text-2xl font-bold text-slate-900">{t('header.photostudio')}</h2>
                </div>
                
                <div className="flex justify-center border-b border-slate-200 mb-6">
                    <button onClick={() => setActiveTab('signin')} className={`py-3 px-6 text-sm font-medium transition-colors relative ${activeTab === 'signin' ? 'text-slate-800' : 'text-slate-500'}`}>
                        {t('auth.signIn')}
                        {activeTab === 'signin' && <motion.div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500" layoutId="auth-underline" />}
                    </button>
                    <button onClick={() => setActiveTab('signup')} className={`py-3 px-6 text-sm font-medium transition-colors relative ${activeTab === 'signup' ? 'text-slate-800' : 'text-slate-500'}`}>
                        {t('auth.signUp')}
                        {activeTab === 'signup' && <motion.div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500" layoutId="auth-underline" />}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <div>
                         <input
                            type="password"
                            placeholder={t('auth.passwordPlaceholder')}
                            className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                     <Button type="submit" primary className="w-full py-3 text-base">
                        {activeTab === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
                    </Button>
                </form>

                <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-slate-300"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium">{t('auth.orDivider')}</span>
                    <div className="flex-grow border-t border-slate-300"></div>
                </div>

                <div className="space-y-3">
                    <Button onClick={() => onLogin('user@google.com')} className="w-full !py-3">
                        <IconGoogle />
                        <span>{t('auth.continueWithGoogle')}</span>
                    </Button>
                    <Button onClick={() => onLogin('user@apple.com')} className="w-full !py-3">
                        <IconApple className="w-6 h-6"/>
                        <span>{t('auth.continueWithApple')}</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    const { t } = useTranslation();
    const { user: authUser, profile, signOut } = useAuth();
    
    // Navigation state
    const [activePage, setActivePage] = useState(() => {
        // Check URL parameters on initial load
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        
        // Handle special pages that aren't in the nav
        if (pageParam === 'admin') {
            return 'admin';
        }
        if (pageParam === 'subscription') {
            return 'subscription';
        }
        
        return t('header.nav.explore');
    });
    
    useEffect(() => {
        // When language changes, reset to explore page using the new language's translation
        const exploreLabel = t('header.nav.explore');
        const specialPages = ['admin', 'subscription'];
        // Only update if the active page translation is now stale
        // Don't reset if on special pages like 'admin' or 'subscription'
        if (specialPages.includes(activePage)) {
            return; // Don't change page on language switch
        }
        if (activePage !== exploreLabel && !Object.values(t('header.nav')).includes(activePage)) {
            setActivePage(exploreLabel);
        }
    }, [t, activePage]);

    useEffect(() => {
        // Reset selections and results when changing design tools to prevent state leakage
        setSelectedTemplateIds([]);
        setSelectedAdvisorIds([]);
        setGeneratedImages([]);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);
        setAdvisorQuestion('');
        setError(null);
        setIsLoading(false);
        setIsAdvisorLoading(false);
        setSelectedBuildingType(BUILDING_TYPES[0].id);
        setSelectedItemType(ITEM_TYPES[0].id);
    }, [activePage]);


    // Auth modal state (user data comes from AuthContext now)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Auto-close auth modal when user logs in
    useEffect(() => {
        if (authUser && isAuthModalOpen) {
            setIsAuthModalOpen(false);
        }
    }, [authUser, isAuthModalOpen]);

    // Core generator state
    const [module1Images, setModule1Images] = useState<(string | null)[]>([null]);
    const [itemReplaceImage, setItemReplaceImage] = useState<string | null>(null);
    const [styleMatchImage, setStyleMatchImage] = useState<string | null>(null);
    const [multiItemImages, setMultiItemImages] = useState<(string | null)[]>(Array(9).fill(null));
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
    const uploadTargetRef = useRef<{ module: 'm1' | 'item' | 'sm' | 'multi', index: number } | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [selectedRoomType, setSelectedRoomType] = useState<string>('living-room');
    const [selectedBuildingType, setSelectedBuildingType] = useState<string>(BUILDING_TYPES[0].id);
    const [selectedItemType, setSelectedItemType] = useState<string>(ITEM_TYPES[0].id);
    
    // AI Advisor State
    const [advisorChat, setAdvisorChat] = useState<Chat | null>(null);
    const [advisorQuestion, setAdvisorQuestion] = useState('');
    const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<string[]>([]);
    const [currentAdvisorResponse, setCurrentAdvisorResponse] = useState<GenerationBatch | null>(null);
    const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

    // History state
    const [generationHistory, setGenerationHistory] = useState<GenerationBatch[]>([]);

    const hasModule1Image = useMemo(() => module1Images.some(img => img !== null), [module1Images]);
    const hasItemReplaceImage = useMemo(() => itemReplaceImage !== null, [itemReplaceImage]);
    const hasStyleMatchImage = useMemo(() => styleMatchImage !== null, [styleMatchImage]);
    const hasMultiItemImages = useMemo(() => multiItemImages.some(img => img !== null), [multiItemImages]);
    const hasSelection = useMemo(() => selectedTemplateIds.length > 0, [selectedTemplateIds]);

    // --- Auth Handlers ---
    // Auth is now handled by AuthContext, no need for local handlers

    // --- Image Handling ---
    
    const handleFileSelect = (module: 'm1' | 'item' | 'sm' | 'multi', index: number) => {
        uploadTargetRef.current = { module, index };
        const input = fileInputRef.current;
        if (input) {
            input.multiple = false;
            input.click();
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const capturedFiles = event.target.files ? Array.from(event.target.files) : [];
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (capturedFiles.length === 0 || !uploadTargetRef.current) return;
        
        const { module, index } = uploadTargetRef.current;
        const uploadKey = `${module}-${index}`;
        
        setUploadingSlots(prev => ({ ...prev, [uploadKey]: true }));
        setError(null);
        
        try {
            const base64Image = await toBase64(capturedFiles[0] as File);
            if (module === 'm1') {
                setModule1Images([base64Image]);
            } else if (module === 'item') {
                setItemReplaceImage(base64Image);
            } else if (module === 'sm') {
                setStyleMatchImage(base64Image);
            } else if (module === 'multi') {
                setMultiItemImages(prev => {
                    const newImages = [...prev];
                    newImages[index] = base64Image;
                    return newImages;
                });
            }
            setGeneratedImages([]);
            setCurrentAdvisorResponse(null);
        } catch (err) {
            console.error(`Error during ${module} upload:`, err);
            setError(t('generate.errors.processFailed'));
        } finally {
            setUploadingSlots(prev => ({ ...prev, [uploadKey]: false }));
            uploadTargetRef.current = null;
        }
    };
    
    const handleRemoveImage = (module: 'm1', index: number) => {
        if (module === 'm1') {
            setModule1Images([null]);
        }
        setGeneratedImages([]);
        setCurrentAdvisorResponse(null);
    };

    const handleRemoveItemImage = () => {
        setItemReplaceImage(null);
        setGeneratedImages([]);
    };
    
    const handleRemoveStyleMatchImage = () => {
        setStyleMatchImage(null);
        setGeneratedImages([]);
    };

    const handleRemoveMultiItemImage = (index: number) => {
        setMultiItemImages(prev => {
            const newImages = [...prev];
            newImages[index] = null;
            return newImages;
        });
        setGeneratedImages([]);
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateIds(prev => {
            if (prev.includes(templateId)) {
                return prev.filter(id => id !== templateId);
            }
            if (prev.length < 9) {
                return [...prev, templateId];
            }
            return prev;
        });
    };

    const handleAdvisorSelect = (personaId: string) => {
        setSelectedAdvisorIds(prev => {
            if (prev.includes(personaId)) {
                return prev.filter(id => id !== personaId);
            }
            if (prev.length < 9) {
                return [...prev, personaId];
            }
            return prev;
        });
    };

    const handleDropOnUploader = async (e: React.DragEvent<HTMLDivElement>, targetModule: 'm1' | 'item' | 'sm') => {
        // First, check for an image dragged from the My Designs sidebar
        const draggedImageSrc = e.dataTransfer.getData('application/homevision-image-src');
        if (draggedImageSrc) {
            if (targetModule === 'm1') setModule1Images([draggedImageSrc]);
            else if (targetModule === 'item') setItemReplaceImage(draggedImageSrc);
            else if (targetModule === 'sm') setStyleMatchImage(draggedImageSrc);
            
            setGeneratedImages([]);
            setCurrentAdvisorResponse(null);
            return;
        }
    
        // Fallback to handle files dragged from the user's computer
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            const uploadKey = `${targetModule}-0`;
            setUploadingSlots(prev => ({ ...prev, [uploadKey]: true }));
            setError(null);
    
            try {
                const base64Image = await toBase64(file);
                if (targetModule === 'm1') setModule1Images([base64Image]);
                else if (targetModule === 'item') setItemReplaceImage(base64Image);
                else if (targetModule === 'sm') setStyleMatchImage(base64Image);
    
                setGeneratedImages([]);
                setCurrentAdvisorResponse(null);
            } catch (err) {
                console.error(`Error during ${targetModule} drop upload:`, err);
                setError(t('generate.errors.processFailed'));
            } finally {
                setUploadingSlots(prev => ({ ...prev, [uploadKey]: false }));
            }
        }
    };

    // --- Generation & Regeneration ---

    const handleGenerateClick = async () => {
        // ✅ Check if user is logged in
        if (!authUser || !profile) {
            setError('请先登录才能使用 AI 生成功能');
            setIsAuthModalOpen(true);
            return;
        }

        // ✅ Check if user has subscription
        if (profile.subscription_tier === 'free') {
            setError('请订阅 Pro、Premium 或 Business 套餐以使用 AI 生成功能');
            // TODO: Navigate to pricing page
            return;
        }

        // ✅ Check if user has enough credits
        if (profile.credits < 1) {
            setError('积分不足！请购买积分包或升级订阅套餐');
            // TODO: Navigate to pricing page
            return;
        }

        const cleanModule1 = module1Images.filter((img): img is string => !!img);
        if (cleanModule1.length === 0) {
            setError(t('generate.errors.noSubject'));
            return;
        }
        if (selectedTemplateIds.length === 0) {
            setError(t('generate.errors.noPrompt'));
            return;
        }
    
        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);

        const pageKey = Object.keys(t('header.nav')).find(key => t('header.nav')[key] === activePage) || 'explore';
        const isWallPaint = pageKey === 'wallPaint';
        const isFloorStyle = pageKey === 'floorStyle';
        const isGardenBackyard = pageKey === 'gardenBackyard';
        const isExteriorDesign = pageKey === 'exteriorDesign';
        const isFestiveDecor = pageKey === 'festiveDecor';
    
        const module1ForApi = cleanModule1.map(img => img.split(',')[1]);

        const allTemplates = isWallPaint
            ? wallPaintCategories.flatMap(c => c.templates)
            : isFloorStyle
                ? floorStyleCategories.flatMap(c => c.templates)
                : isGardenBackyard
                    ? gardenCategories.flatMap(c => c.templates)
                    : isExteriorDesign
                        ? exteriorCategories.flatMap(c => c.templates)
                        : isFestiveDecor
                            ? festiveCategories.flatMap(c => c.templates)
                            : interiorCategories.flatMap(c => c.templates);

        const selectedTemplates = selectedTemplateIds.map(id => 
            allTemplates.find(t => t.id === id)
        ).filter((t): t is PromptTemplate => !!t);
        
        const roomTypeName = t(`roomTypes.${selectedRoomType}`);
        const buildingTypeName = t(`buildingTypes.${selectedBuildingType}`);

        const placeholders: GeneratedImage[] = selectedTemplates.map(template => ({
            id: template.name,
            status: 'pending',
            imageUrl: null,
            promptBase: isWallPaint || isGardenBackyard || isFloorStyle
                ? template.prompt
                : isExteriorDesign
                    ? `A ${buildingTypeName}, ${template.prompt}`
                    : `A ${roomTypeName}, ${template.prompt}`,
        }));
        
        setGeneratedImages(placeholders);
    
        const finalResults = await Promise.all(placeholders.map(async (placeholder) => {
            try {
                const imageUrl = await generateImage(getModelInstruction(placeholder.promptBase), module1ForApi);
                return { ...placeholder, status: 'success' as const, imageUrl };
            } catch (err) {
                console.error(`Generation failed for ${placeholder.id}:`, err);
                return { ...placeholder, status: 'failed' as const };
            }
        }));
    
        setGeneratedImages(finalResults);
    
        const newBatch: GenerationBatch = {
            id: Date.now().toString(),
            type: isWallPaint ? 'wall_paint' : (isFloorStyle ? 'floor_style' : (isGardenBackyard ? 'garden' : (isExteriorDesign ? 'exterior' : (isFestiveDecor ? 'festive' : 'style')))),
            timestamp: new Date(),
            subjectImage: cleanModule1[0],
            styleImages: [],
            prompt: selectedTemplates.map(t => t.name).join(', '),
            results: finalResults,
            templateIds: selectedTemplateIds,
            ...(isExteriorDesign && { buildingTypeId: selectedBuildingType }),
        };
        setGenerationHistory(prev => [newBatch, ...prev]);
    
        setIsLoading(false);
    };

    const handleItemReplaceClick = async () => {
        const roomImage = module1Images.find((img): img is string => !!img);
        if (!roomImage || !itemReplaceImage) {
            setError(t('generate.errors.noSubject'));
            return;
        }
    
        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);
    
        const roomImageForApi = roomImage.split(',')[1];
        const itemImageForApi = itemReplaceImage.split(',')[1];
        const itemTypeName = t(`itemTypes.${selectedItemType}`);
    
        const instruction = `This is an interior design task. The first image is a photo of a room. The second image is a ${itemTypeName}. Your task is to seamlessly integrate the object from the second image into the first image. The object should replace a suitable existing object in the room if one exists, or be placed naturally if the space is empty. You MUST strictly adhere to the lighting, shadows, perspective, and overall style of the room photo to produce a photorealistic, high-quality result. The final output should be a single, edited photograph of the room with the new object perfectly blended in.`;
    
        const placeholder: GeneratedImage = {
            id: 'item-replace-result',
            status: 'pending',
            imageUrl: null,
            promptBase: instruction,
        };
        
        setGeneratedImages([placeholder]);
    
        try {
            const imageUrl = await generateImage(instruction, [roomImageForApi, itemImageForApi]);
            const finalResult = { ...placeholder, status: 'success' as const, imageUrl };
            setGeneratedImages([finalResult]);
    
            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'item_replace',
                timestamp: new Date(),
                subjectImage: roomImage,
                styleImages: [itemReplaceImage],
                prompt: t('myRenders.itemReplacePrompt'),
                results: [finalResult],
                templateIds: [],
            };
            setGenerationHistory(prev => [newBatch, ...prev]);
    
        } catch (err) {
            console.error(`Item replacement failed:`, err);
            const finalResult = { ...placeholder, status: 'failed' as const };
            setGeneratedImages([finalResult]);
        }
    
        setIsLoading(false);
    };

    const handleStyleMatchClick = async () => {
        const roomImage = module1Images.find((img): img is string => !!img);
        if (!roomImage || !styleMatchImage) {
            setError(t('generate.errors.styleMatchMissingImages'));
            return;
        }
    
        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);
    
        const roomImageForApi = roomImage.split(',')[1];
        const styleImageForApi = styleMatchImage.split(',')[1];
    
        const instruction = `This is a high-stakes interior design 'style transfer' task. The first image is the 'source' room, showing the spatial layout, window positions, and core structure. The second image is the 'target style' reference. Your goal is to COMPLETELY redesign the source room to perfectly match the aesthetic of the target style image. This includes adopting the target's color palette, material textures (e.g., wood, metal, fabric types), furniture styles, lighting quality, and overall mood. You MUST preserve the fundamental architectural layout of the source room. The final output must be a single, photorealistic image of the redesigned room.`;
    
        const placeholder: GeneratedImage = {
            id: 'style-match-result',
            status: 'pending',
            imageUrl: null,
            promptBase: instruction,
        };
        
        setGeneratedImages([placeholder]);
    
        try {
            const imageUrl = await generateImage(instruction, [roomImageForApi, styleImageForApi]);
            const finalResult = { ...placeholder, status: 'success' as const, imageUrl };
            setGeneratedImages([finalResult]);
    
            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'style_match',
                timestamp: new Date(),
                subjectImage: roomImage,
                styleImages: [styleMatchImage],
                prompt: t('myRenders.styleMatchPrompt'),
                results: [finalResult],
                templateIds: [],
            };
            setGenerationHistory(prev => [newBatch, ...prev]);
    
        } catch (err) {
            console.error(`Style Match failed:`, err);
            const finalResult = { ...placeholder, status: 'failed' as const };
            setGeneratedImages([finalResult]);
        }
    
        setIsLoading(false);
    };

    const handleMultiItemPreviewClick = async () => {
        const roomImage = module1Images.find((img): img is string => !!img);
        const itemImages = multiItemImages.filter((img): img is string => !!img);
    
        if (!roomImage) {
            setError(t('generate.errors.noSubject'));
            return;
        }
        if (itemImages.length === 0) {
            setError(t('generate.errors.noItems'));
            return;
        }
    
        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);
    
        const roomImageForApi = roomImage.split(',')[1];
        const itemImagesForApi = itemImages.map(img => img.split(',')[1]);
        const allImagesForApi = [roomImageForApi, ...itemImagesForApi];
    
        const instruction = `CRITICAL TASK: Your goal is to seamlessly integrate all of the provided furniture/item images into the main room photo. Place them in logical and aesthetically pleasing positions. You MUST strictly adhere to the room's existing lighting, shadows, perspective, and overall style to produce a photorealistic, high-quality result. The final output should be a single, edited photograph of the room with the new objects perfectly blended in.`;
    
        const placeholder: GeneratedImage = {
            id: 'multi-item-result',
            status: 'pending' as const,
            imageUrl: null,
            promptBase: instruction,
        };
        
        setGeneratedImages([placeholder]);
    
        try {
            const imageUrl = await generateImage(getModelInstruction(placeholder.promptBase), allImagesForApi);
            const finalResult = { ...placeholder, status: 'success' as const, imageUrl };
            setGeneratedImages([finalResult]);
    
            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'multi_item',
                timestamp: new Date(),
                subjectImage: roomImage,
                styleImages: itemImages,
                prompt: t('myRenders.albumTypes.multi_item'),
                results: [finalResult],
                templateIds: [],
            };
            setGenerationHistory(prev => [newBatch, ...prev]);
        } catch (err) {
            console.error(`Multi-item placement failed:`, err);
            const finalResult = { ...placeholder, status: 'failed' as const };
            setGeneratedImages([finalResult]);
        }
    
        setIsLoading(false);
    };

    const handleAskAdvisorClick = async () => {
        if (!advisorQuestion.trim()) {
            setError(t('generate.errors.noQuestion'));
            return;
        }
        if (selectedAdvisorIds.length === 0) {
            setError(t('generate.errors.noPersona'));
            return;
        }

        setIsAdvisorLoading(true);
        setError(null);
        setGeneratedImages([]);

        const roomImage = module1Images.find((img): img is string => !!img) || null;
        const userMessageText = advisorQuestion;
        setAdvisorQuestion('');

        // Multi-persona logic (one-shot Q&A)
        if (selectedAdvisorIds.length > 1) {
            const selectedPersonas = ALL_ADVISORS.filter(p => selectedAdvisorIds.includes(p.id));
            
            const responses = await Promise.all(selectedPersonas.map(async (persona) => {
                try {
                    const text = await generateTextResponse(userMessageText, persona.systemInstruction, roomImage);
                    return { personaId: persona.id, text, status: 'success' as const };
                } catch (err) {
                    console.error(`Error with persona ${persona.name}:`, err);
                    return { personaId: persona.id, text: 'Failed to get a response.', status: 'failed' as const };
                }
            }));

            const successfulResponses = responses
                .filter(r => r.status === 'success')
                .map(({ personaId, text }) => ({ personaId, text }));

            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'ai_advisor',
                timestamp: new Date(),
                subjectImage: roomImage,
                styleImages: [],
                prompt: userMessageText,
                results: [],
                templateIds: selectedAdvisorIds,
                multiModelResponses: successfulResponses,
            };

            setCurrentAdvisorResponse(newBatch);
            setGenerationHistory(prev => [newBatch, ...prev]);
            setIsAdvisorLoading(false);
            return;
        }

        // Single-persona logic (conversational)
        const selectedAdvisorId = selectedAdvisorIds[0];
        const persona = ALL_ADVISORS.find(p => p.id === selectedAdvisorId);
        if (!persona) {
            setIsAdvisorLoading(false);
            return;
        }

        let chat = advisorChat;
        const previousBatch = currentAdvisorResponse;

        const personaChanged = previousBatch?.templateIds[0] !== selectedAdvisorId;
        const imageChanged = previousBatch?.subjectImage !== roomImage;
        const isNewConversation = !previousBatch || previousBatch.type !== 'ai_advisor';

        if (!chat || personaChanged || imageChanged || isNewConversation) {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: persona.systemInstruction,
                },
                history: [],
            });
            chat = newChat;
            setAdvisorChat(newChat);
        }

        const messageParts: (string | { inlineData: { mimeType: string; data: string; } })[] = [userMessageText];
        
        const isFirstMessageOfSession = !previousBatch?.chatHistory?.length || personaChanged || imageChanged || isNewConversation;

        if (isFirstMessageOfSession && roomImage) {
             messageParts.unshift({
                inlineData: {
                    data: roomImage.split(',')[1],
                    mimeType: 'image/png',
                },
            });
        }
        
        try {
            const response = await chat.sendMessage({ message: messageParts });
            const responseText = response.text;

            const userMessage: ChatMessage = { role: 'user', text: userMessageText };
            const modelMessage: ChatMessage = { role: 'model', text: responseText };

            if (!isFirstMessageOfSession && previousBatch) {
                const updatedBatch: GenerationBatch = {
                    ...previousBatch,
                    chatHistory: [...(previousBatch.chatHistory || []), userMessage, modelMessage],
                };
                setCurrentAdvisorResponse(updatedBatch);
                setGenerationHistory(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
            } else {
                const newBatch: GenerationBatch = {
                    id: Date.now().toString(),
                    type: 'ai_advisor',
                    timestamp: new Date(),
                    subjectImage: roomImage,
                    styleImages: [],
                    prompt: userMessageText,
                    results: [],
                    templateIds: [selectedAdvisorId],
                    chatHistory: [userMessage, modelMessage],
                };
                setCurrentAdvisorResponse(newBatch);
                setGenerationHistory(prev => [newBatch, ...prev]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setIsAdvisorLoading(false);
        }
    };

    const regenerateImageAtIndex = async (imageIndex: number) => {
        const imageToRegenerate = generatedImages[imageIndex];
        const cleanModule1 = module1Images.filter((img): img is string => !!img);
        if (!imageToRegenerate || cleanModule1.length === 0) return;
    
        setGeneratedImages(prev => prev.map((img, index) => index === imageIndex ? { ...img, status: 'pending' } : img));
        setError(null);
    
        const { id, promptBase } = imageToRegenerate;
        const module1ForApi = cleanModule1.map(img => img.split(',')[1]);
        const allImagesForApi = [...module1ForApi];

        // For item replace and style match, we need to re-send the second image
        const navTranslations = t('header.nav');
        const pageKey = Object.keys(navTranslations).find(key => navTranslations[key] === activePage) || 'explore';
        if (pageKey === 'itemReplace' && itemReplaceImage) {
            allImagesForApi.push(itemReplaceImage.split(',')[1]);
        }
        if (pageKey === 'styleMatch' && styleMatchImage) {
            allImagesForApi.push(styleMatchImage.split(',')[1]);
        }
        if (pageKey === 'multiItemPreview') {
             const itemImages = multiItemImages.filter((img): img is string => !!img);
             const itemImagesForApi = itemImages.map(img => img.split(',')[1]);
             allImagesForApi.push(...itemImagesForApi);
        }
    
        try {
            const imageUrl = await generateImage(getModelInstruction(promptBase), allImagesForApi);
            setGeneratedImages(prev => prev.map((img, i) => i === imageIndex ? { ...img, status: 'success', imageUrl } : img));
        } catch (err) {
            setError(t('generate.errors.regenerationFailed', id));
            setGeneratedImages(prev => prev.map((img, i) => i === imageIndex ? { ...img, status: 'failed' } : img));
        }
    };

    const handleRerunBatch = (batch: GenerationBatch) => {
        setModule1Images([batch.subjectImage]);
        setGeneratedImages([]);
        setCurrentAdvisorResponse(null);
        setItemReplaceImage(null);
        setStyleMatchImage(null);
        setMultiItemImages(Array(9).fill(null));
        setAdvisorQuestion('');
        setSelectedAdvisorIds([]);
        setAdvisorChat(null);
    
        if (batch.type === 'item_replace' && batch.styleImages.length > 0) {
            setItemReplaceImage(batch.styleImages[0]);
            setSelectedTemplateIds([]);
            setActivePage(t('header.nav.itemReplace'));
        } else if (batch.type === 'wall_paint') {
            setSelectedTemplateIds(batch.templateIds || []);
            setActivePage(t('header.nav.wallPaint'));
        } else if (batch.type === 'floor_style') {
            setSelectedTemplateIds(batch.templateIds || []);
            setActivePage(t('header.nav.floorStyle'));
        } else if (batch.type === 'garden') {
            setSelectedTemplateIds(batch.templateIds || []);
            setActivePage(t('header.nav.gardenBackyard'));
        } else if (batch.type === 'style_match') {
            setStyleMatchImage(batch.styleImages[0] || null);
            setSelectedTemplateIds([]);
            setActivePage(t('header.nav.styleMatch'));
        } else if (batch.type === 'ai_advisor') {
            setActivePage(t('header.nav.aiAdvisor'));
            setModule1Images([batch.subjectImage]);
            setSelectedAdvisorIds(batch.templateIds || []);
            setAdvisorQuestion('');
            setCurrentAdvisorResponse(batch);
            
            // Only restore chat session for single-persona history
            if (batch.chatHistory && batch.templateIds.length === 1) {
                const persona = ALL_ADVISORS.find(p => p.id === batch.templateIds[0]);
                if (persona) {
                    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY });
                    const historyForChat: Content[] = batch.chatHistory.map(msg => ({
                        role: msg.role,
                        parts: [{ text: msg.text }]
                    }));

                    const newChat = ai.chats.create({
                        model: 'gemini-2.5-flash',
                        config: {
                            systemInstruction: persona.systemInstruction,
                        },
                        history: historyForChat,
                    });
                    setAdvisorChat(newChat);
                }
            }
        } else if (batch.type === 'multi_item') {
            const newMultiItemImages = Array(9).fill(null);
            batch.styleImages.forEach((img, i) => {
                if (i < 9) newMultiItemImages[i] = img;
            });
            setMultiItemImages(newMultiItemImages);
            setSelectedTemplateIds(batch.templateIds || []);
            setActivePage(t('header.nav.multiItemPreview'));
        } else if (batch.type === 'exterior') {
            setSelectedTemplateIds(batch.templateIds || []);
            if (batch.buildingTypeId) {
                setSelectedBuildingType(batch.buildingTypeId);
            }
            setActivePage(t('header.nav.exteriorDesign'));
        } else if (batch.type === 'festive') {
            setSelectedTemplateIds(batch.templateIds || []);
            setActivePage(t('header.nav.festiveDecor'));
        } else { // 'style' or default
            setSelectedTemplateIds(batch.templateIds || []);
            setActivePage(t('header.nav.interiorDesign'));
        }
    };

    const handleDeleteImageFromHistory = (batchId: string, imageId: string) => {
        const imageBatchTypes: GenerationBatch['type'][] = ['style', 'item_replace', 'wall_paint', 'floor_style', 'garden', 'style_match', 'multi_item', 'exterior', 'festive', 'free_canvas'];
        setGenerationHistory(prevHistory => {
            const newHistory = prevHistory.map(batch => {
                if (batch.id === batchId) {
                    const newResults = batch.results.filter(result => result.id !== imageId);
                    if (newResults.length === 0 && imageBatchTypes.includes(batch.type)) {
                        return null;
                    }
                    return { ...batch, results: newResults };
                }
                return batch;
            });
            return newHistory.filter((b): b is GenerationBatch => b !== null);
        });
    };

    // --- Downloading ---
    const handleDownloadRequest = async (imageUrl: string, era: string) => {
        const fileName = `interiorai-${era.toLowerCase().replace(/\s+/g, '-')}.png`;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const isAnySlotUploading = Object.values(uploadingSlots).some(Boolean);
    const hasGeneratedImages = generatedImages.length > 0;
    const generationButtonText = hasSelection
        ? t('generate.button.generateNPhotos', selectedTemplateIds.length)
        : t('generate.button.generateOnePhoto');
    const progress = hasGeneratedImages ? (generatedImages.filter(img => img.status !== 'pending').length / generatedImages.length) * 100 : 0;

    // Load room types for Interior Design
    const { roomTypes, loading: roomTypesLoading } = useRoomTypes();
    
    // Get selected room type ID
    const selectedRoomTypeObj = roomTypes.find(rt => rt.room_key === selectedRoomType);
    const selectedRoomTypeId = selectedRoomTypeObj?.id || null;
    
    // Load style categories based on selected room type
    const { categories: interiorCategories, loading: interiorLoading } = useStyleCategories(selectedRoomTypeId);
    
    // Load templates for other feature pages
    // Note: Some features temporarily disabled (not yet implemented in database)
    // const { categories: wallPaintCategories, loading: wallPaintLoading } = useFeaturePageTemplates('wall-finishes');
    const wallPaintCategories = []; // Placeholder until feature is implemented
    const wallPaintLoading = false;
    
    const { categories: floorStyleCategories, loading: floorLoading } = useFeaturePageTemplates('floor-style');
    
    // const { categories: gardenCategories, loading: gardenLoading } = useFeaturePageTemplates('garden-backyard');
    const gardenCategories = []; // Placeholder - no templates yet
    const gardenLoading = false;
    
    // const { categories: exteriorCategories, loading: exteriorLoading } = useFeaturePageTemplates('exterior-design');
    const exteriorCategories = []; // Placeholder - no templates yet
    const exteriorLoading = false;
    
    const { categories: festiveCategories, loading: festiveLoading } = useFeaturePageTemplates('festive-decor');
    
    // For explore page, we'll use all templates (to be implemented later)
    const exploreTemplates: any[] = [];
    const exploreLoading = false;

    const renderPage = () => {
        const navTranslations = t('header.nav');
        // Handle special pages that aren't in translations
        const specialPages = ['admin', 'subscription'];
        let pageKey = specialPages.includes(activePage) 
            ? activePage 
            : Object.keys(navTranslations).find(key => navTranslations[key] === activePage) || 'explore';
        
        // Debug logging
        console.log('🔍 RenderPage Debug:', {
            activePage,
            pageKey,
            specialPages,
            isSpecialPage: specialPages.includes(activePage)
        });
        
        const categoriesForRoom = interiorCategories;
        
        const designToolKeys = ['interiorDesign', 'festiveDecor', 'exteriorDesign', 'itemReplace', 'wallPaint', 'floorStyle', 'gardenBackyard', 'styleMatch', 'aiAdvisor', 'multiItemPreview', 'freeCanvas'];

        if (designToolKeys.includes(pageKey) && pageKey !== 'freeCanvas') {
            const isItemReplace = pageKey === 'itemReplace';
            const isWallPaint = pageKey === 'wallPaint';
            const isFloorStyle = pageKey === 'floorStyle';
            const isGardenBackyard = pageKey === 'gardenBackyard';
            const isExteriorDesign = pageKey === 'exteriorDesign';
            const isStyleMatch = pageKey === 'styleMatch';
            const isAiAdvisor = pageKey === 'aiAdvisor';
            const isMultiItem = pageKey === 'multiItemPreview';
            const isFestiveDecor = pageKey === 'festiveDecor';

            const showRoomTypeSelector = !isItemReplace && !isWallPaint && !isFloorStyle && !isGardenBackyard && !isStyleMatch && !isAiAdvisor && !isExteriorDesign && !isMultiItem;

            return (
                 <div className="flex flex-1 overflow-hidden">
                    {/* Left Control Panel */}
                    <aside className="w-[380px] bg-white p-6 flex flex-col gap-8 overflow-y-auto scrollbar-hide flex-shrink-0 border-r border-slate-200">
                        <div className="space-y-8">
                            <ImageUploader
                                title={
                                    isGardenBackyard ? t('generate.gardenSubject') : 
                                    (isAiAdvisor ? t('generate.optionalContext') : 
                                    (isExteriorDesign ? t('generate.exteriorSubject') : t('generate.primarySubject')))
                                }
                                description={
                                    isGardenBackyard ? t('generate.gardenSubjectDesc') : 
                                    (isAiAdvisor ? t('generate.optionalContextDesc') : 
                                    (isExteriorDesign ? t('generate.exteriorSubjectDesc') : t('generate.primarySubjectDesc')))
                                }
                                imageUrl={module1Images[0]}
                                isUploading={!!uploadingSlots['m1-0']}
                                onFileSelect={() => handleFileSelect('m1', 0)}
                                onRemove={() => handleRemoveImage('m1', 0)}
                                onImageClick={setFullScreenImage}
                                onDrop={(e) => handleDropOnUploader(e, 'm1')}
                            />
                            
                            {isItemReplace && (
                                <ImageUploader
                                    title={t('generate.itemToPlace')}
                                    description={t('generate.itemToPlaceDesc')}
                                    imageUrl={itemReplaceImage}
                                    isUploading={!!uploadingSlots['item-0']}
                                    onFileSelect={() => handleFileSelect('item', 0)}
                                    onRemove={handleRemoveItemImage}
                                    onImageClick={setFullScreenImage}
                                    onDrop={(e) => handleDropOnUploader(e, 'item')}
                                />
                            )}
                            
                            {isStyleMatch && (
                                <ImageUploader
                                    title={t('generate.targetStylePhoto')}
                                    description={t('generate.targetStylePhotoDesc')}
                                    imageUrl={styleMatchImage}
                                    isUploading={!!uploadingSlots['sm-0']}
                                    onFileSelect={() => handleFileSelect('sm', 0)}
                                    onRemove={handleRemoveStyleMatchImage}
                                    onImageClick={setFullScreenImage}
                                    onDrop={(e) => handleDropOnUploader(e, 'sm')}
                                />
                            )}

                            {isMultiItem && (
                                <MultiItemUploader
                                    images={multiItemImages}
                                    isUploadingSlots={uploadingSlots}
                                    onFileSelect={(index) => handleFileSelect('multi', index)}
                                    onRemove={handleRemoveMultiItemImage}
                                />
                            )}

                             {isAiAdvisor && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('generate.askAdvisor')}</h3>
                                    <textarea
                                        value={advisorQuestion}
                                        onChange={(e) => setAdvisorQuestion(e.target.value)}
                                        placeholder={t('generate.advisorPlaceholder')}
                                        className="w-full p-3 h-32 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        aria-label={t('generate.askAdvisor')}
                                    />
                                </div>
                            )}

                            {isItemReplace && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('generate.chooseItemType')}</h3>
                                    <div className="relative">
                                        <select
                                            value={selectedItemType}
                                            onChange={(e) => setSelectedItemType(e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer"
                                            aria-label={t('generate.chooseItemType')}
                                        >
                                            {ITEM_TYPES.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {t(`itemTypes.${item.id}`)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                            <IconChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isExteriorDesign && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('generate.chooseBuildingType')}</h3>
                                    <div className="relative">
                                        <select
                                            value={selectedBuildingType}
                                            onChange={(e) => setSelectedBuildingType(e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer"
                                            aria-label={t('generate.chooseBuildingType')}
                                        >
                                            {BUILDING_TYPES.map(building => (
                                                <option key={building.id} value={building.id}>
                                                    {t(`buildingTypes.${building.id}`)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                            <IconChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showRoomTypeSelector && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('generate.chooseRoomType')}</h3>
                                    <div className="relative">
                                        {roomTypesLoading ? (
                                            <div className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg text-center text-slate-500">
                                                Loading room types...
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedRoomType}
                                                onChange={(e) => setSelectedRoomType(e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer"
                                                aria-label={t('generate.chooseRoomType')}
                                            >
                                                {roomTypes.map(room => (
                                                    <option key={room.room_key} value={room.room_key}>
                                                        {room.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                            <IconChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {!isItemReplace && !isStyleMatch && !isAiAdvisor && !isMultiItem && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-slate-800">{isWallPaint ? t('generate.chooseWallPaint') : isFloorStyle ? t('generate.chooseFloorStyle') : t('generate.chooseStyle')}</h2>
                                    {(roomTypesLoading || interiorLoading || wallPaintLoading || floorLoading || gardenLoading || exteriorLoading || festiveLoading) ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                                        </div>
                                    ) : interiorCategories.length === 0 && !isWallPaint && !isFloorStyle && !isGardenBackyard && !isExteriorDesign && !isFestiveDecor ? (
                                        <div className="text-center py-12 text-slate-600">
                                            <p>No style categories available for this room type yet.</p>
                                            <p className="text-sm mt-2">Please add templates in the admin panel.</p>
                                        </div>
                                    ) : (
                                        <PromptTemplates
                                            categories={
                                                isWallPaint ? wallPaintCategories :
                                                isFloorStyle ? floorStyleCategories :
                                                isGardenBackyard ? gardenCategories :
                                                isExteriorDesign ? exteriorCategories :
                                                isFestiveDecor ? festiveCategories :
                                                categoriesForRoom
                                            }
                                            onTemplateSelect={handleTemplateSelect}
                                            selectedTemplateIds={selectedTemplateIds}
                                        />
                                    )}
                                </div>
                            )}

                            {isAiAdvisor && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-slate-800">{t('generate.choosePersona')}</h2>
                                    <div className="grid grid-cols-4 gap-4">
                                        {ALL_ADVISORS.map((persona) => {
                                            const isSelected = selectedAdvisorIds.includes(persona.id);
                                            const limitReached = selectedAdvisorIds.length >= 9;
                                            const isDisabled = !isSelected && limitReached;
                                            return (
                                                <div
                                                    key={persona.id}
                                                    onClick={() => !isDisabled && handleAdvisorSelect(persona.id)}
                                                    className={`group relative text-center ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                                >
                                                    <div className="absolute bottom-full mb-3 w-48 left-1/2 -translate-x-1/2 p-2 rounded-lg bg-slate-800 text-white text-xs font-normal shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                                        <p className='font-bold mb-1'>{t(`personas.${persona.id}`)}</p>
                                                        <p>{t(`personas.${persona.id}_desc`)}</p>
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800"></div>
                                                    </div>

                                                    <div className={`relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 transition-all duration-300 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 group-hover:border-indigo-400'}`}>
                                                        <img src={persona.imageUrl} alt={persona.name} className="w-full h-full object-cover" />
                                                         {isSelected && (
                                                            <div className="absolute inset-0 bg-indigo-700/60 flex items-center justify-center">
                                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                                                    <IconCheck className="w-4 h-4 text-indigo-600" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs mt-2 font-medium transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`}>{t(`personas.${persona.id}`)}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
                        
                        <div className="mt-auto pt-6">
                             <Button
                                onClick={
                                    isItemReplace ? handleItemReplaceClick : 
                                    (isStyleMatch ? handleStyleMatchClick : 
                                    (isAiAdvisor ? handleAskAdvisorClick : 
                                    (isMultiItem ? handleMultiItemPreviewClick : handleGenerateClick)))
                                }
                                disabled={
                                    isLoading || isAnySlotUploading || isAdvisorLoading ||
                                    (isItemReplace
                                        ? !hasModule1Image || !hasItemReplaceImage
                                        : (isStyleMatch
                                            ? !hasModule1Image || !hasStyleMatchImage
                                            : (isAiAdvisor
                                                ? !advisorQuestion || selectedAdvisorIds.length === 0
                                                : (isMultiItem
                                                    ? !hasModule1Image || !hasMultiItemImages
                                                    : !hasModule1Image || !hasSelection))))
                                }
                                primary
                                className="w-full text-base py-3"
                            >
                                <IconSparkles className="w-5 h-5" />
                                {isLoading
                                    ? t('generate.button.generating', Math.round(progress))
                                    : isAdvisorLoading ? t('generate.button.generating', 0).replace('(0%)', '...')
                                    : (isItemReplace
                                        ? t('generate.button.replace')
                                        : (isStyleMatch
                                            ? generationButtonText
                                            : (isMultiItem
                                                ? t('generate.button.generateOnePhoto')
                                                : (isAiAdvisor
                                                    ? t('generate.button.ask')
                                                    : generationButtonText))))
                                }
                            </Button>
                        </div>
                    </aside>

                    {/* Right Results Display */}
                    <main className="flex-1 p-8 overflow-y-auto flex flex-col items-center bg-slate-50">
                        {isAiAdvisor ? (
                             <div className="w-full h-full max-w-3xl mx-auto flex flex-col">
                                {(!currentAdvisorResponse) && !isAdvisorLoading && (
                                    <div className="flex-1 flex items-center justify-center">
                                        <ResultsPlaceholder isAdvisor />
                                    </div>
                                )}
                                
                                {currentAdvisorResponse?.chatHistory && currentAdvisorResponse.chatHistory.length > 0 && (
                                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 -mr-4">
                                        {currentAdvisorResponse.chatHistory.map((msg, index) => {
                                            const persona = ALL_ADVISORS.find(p => p.id === currentAdvisorResponse.templateIds[0]);
                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm overflow-hidden ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-200'}`}>
                                                        {msg.role === 'user' 
                                                            ? (authUser?.email?.charAt(0).toUpperCase() || 'U') 
                                                            : persona 
                                                                ? <img src={persona.imageUrl} alt={persona.name} className="w-full h-full object-cover" />
                                                                : 'AI'
                                                        }
                                                    </div>
                                                    <div className={`p-4 rounded-lg max-w-xl prose prose-indigo ${msg.role === 'user' ? 'bg-indigo-500 text-white prose-invert' : 'bg-white border border-slate-200'}`}>
                                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {currentAdvisorResponse?.multiModelResponses && (
                                     <div className="flex-1 overflow-y-auto space-y-6 pr-4 -mr-4 w-full">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-start gap-3 flex-row-reverse"
                                        >
                                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm overflow-hidden bg-indigo-500 text-white">
                                                {authUser?.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="p-4 rounded-lg max-w-xl prose prose-indigo bg-indigo-500 text-white prose-invert">
                                                <p>{currentAdvisorResponse.prompt}</p>
                                            </div>
                                        </motion.div>

                                        {currentAdvisorResponse.multiModelResponses.map((response, index) => {
                                            const persona = ALL_ADVISORS.find(p => p.id === response.personaId);
                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
                                                    className="flex items-start gap-3"
                                                >
                                                     <div className="w-8 h-8 rounded-full flex-shrink-0 bg-slate-200 flex items-center justify-center overflow-hidden">
                                                        {persona 
                                                            ? <img src={persona.imageUrl} alt={persona.name} className="w-full h-full object-cover" />
                                                            : 'AI'
                                                        }
                                                    </div>
                                                    <div className="p-4 rounded-lg max-w-xl prose prose-indigo bg-white border border-slate-200">
                                                        <div dangerouslySetInnerHTML={{ __html: response.text.replace(/\n/g, '<br />') }} />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                     </div>
                                )}

                                {isAdvisorLoading && (
                                     <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-3 mt-6"
                                    >
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-slate-200 flex items-center justify-center overflow-hidden">
                                            <IconSparkles className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="p-4 rounded-lg bg-white border border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full">
                                {!hasGeneratedImages && !isLoading && <ResultsPlaceholder />}
                                
                                {(hasGeneratedImages || isLoading) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                        {(isLoading && generatedImages.length === 0 ? Array.from({length: isItemReplace || isStyleMatch || isMultiItem ? 1 : (selectedTemplateIds.length || 1)}, () => null) : generatedImages).map((img, index) => {
                                            if (!img) return <LoadingCard key={`loading-skeleton-${index}`} />;
                                            switch (img.status) {
                                                case 'success': return <PhotoDisplay key={`${img.id}-${index}-success`} era={img.id} imageUrl={img.imageUrl!} onDownload={handleDownloadRequest} onRegenerate={() => regenerateImageAtIndex(index)} onImageClick={setFullScreenImage} onDragStart={(e) => { e.dataTransfer.setData("text/plain", img.imageUrl!); e.dataTransfer.effectAllowed = "copy"; }} />;
                                                case 'failed': return <ErrorCard key={`${img.id}-${index}-failed`} onRegenerate={() => regenerateImageAtIndex(index)} />;
                                                case 'pending': default: return <LoadingCard key={`${img.id}-${index}-pending`} />;
                                            }
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                    <MyDesignsSidebar
                        generationHistory={generationHistory}
                        onDownload={handleDownloadRequest}
                        setFullScreenImage={setFullScreenImage}
                        onDelete={handleDeleteImageFromHistory}
                        onImageDragStart={(e, src) => {
                            e.dataTransfer.setData('application/homevision-image-src', src);
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                    />
                </div>
            );
        }

        switch (pageKey) {
            case 'explore':
                return <ExplorePage onNavigate={setActivePage} exploreTemplates={exploreTemplates} exploreLoading={exploreLoading} />;
            case 'myRenders':
                return <MyRendersPage history={generationHistory} onNavigate={setActivePage} onDownload={handleDownloadRequest} setFullScreenImage={setFullScreenImage} onDelete={handleDeleteImageFromHistory} />;
            case 'term':
                return <StaticPage pageKey="term" />;
            case 'pricing':
                return <PricingPage />;
            case 'subscription':
                return <SubscriptionManagePage />;
            case 'faq':
                return <StaticPage pageKey="faq" />;
            case 'blog':
                return <BlogPage />;
            case 'freeCanvas':
                return <FreeCanvasPage 
                    setGenerationHistory={setGenerationHistory} 
                    generationHistory={generationHistory}
                    onDownload={handleDownloadRequest}
                    setFullScreenImage={setFullScreenImage}
                />;
            case 'admin':
                return <AdminPage />;
            default:
                return <ExplorePage onNavigate={setActivePage} exploreTemplates={exploreTemplates} exploreLoading={exploreLoading} />;
        }
    };
    
    // If auth modal is open, show only AuthPage
    if (isAuthModalOpen) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsAuthModalOpen(false)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-slate-900 z-50 transition-colors"
                >
                    <IconX />
                </button>
                <AuthPage />
            </div>
        );
    }

    return (
        <>
            <CameraModal isOpen={false} onClose={() => {}} onCapture={() => {}} />
            <ImageViewerModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
            <ErrorNotification message={error} onDismiss={() => setError(null)} />

            <div className="flex flex-col h-screen bg-slate-50 text-slate-800">
                <Header 
                  activeItem={activePage} 
                  onNavigate={setActivePage} 
                  user={authUser ? { email: authUser.email || '' } : null}
                  onLoginClick={() => setIsAuthModalOpen(true)}
                  onLogout={async () => {
                    await signOut();
                    window.location.href = '/';
                  }}
                />
                {renderPage()}
            </div>
        </>
    );
};

export default App;
