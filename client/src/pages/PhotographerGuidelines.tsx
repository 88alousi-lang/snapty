import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle } from 'lucide-react';
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

interface Guideline {
  id: number;
  title: string;
  description: string;
  tips: string[];
  goodImage: string;
  badImage: string;
}

const guidelines: Guideline[] = [
  {
    id: 1,
    title: "Proper Lighting",
    description: "Use natural light and supplemental lighting to ensure well-lit, professional-looking photos",
    tips: [
      "Shoot during golden hour (early morning or late afternoon)",
      "Use window light to your advantage",
      "Avoid harsh shadows and backlighting",
      "Use fill lights for dark areas"
    ],
    goodImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop"
  },
  {
    id: 2,
    title: "Composition & Framing",
    description: "Frame shots to showcase the entire room or space with balanced composition",
    tips: [
      "Use the rule of thirds for balanced composition",
      "Include the entire room in the frame",
      "Avoid cutting off important features",
      "Position furniture naturally"
    ],
    goodImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop"
  },
  {
    id: 3,
    title: "Wide Angle Shots",
    description: "Capture the full room layout with wide-angle lenses for complete room coverage",
    tips: [
      "Use 16-35mm lenses for interior shots",
      "Show the complete room dimensions",
      "Include all major furniture pieces",
      "Avoid excessive distortion"
    ],
    goodImage: "https://images.unsplash.com/photo-1565183938294-7563f3ce68c5?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop"
  },
  {
    id: 4,
    title: "Exterior Photography",
    description: "Capture clear, well-lit exterior shots of the entire property",
    tips: [
      "Shoot from the street or driveway",
      "Include the entire front facade",
      "Avoid parked cars in the frame",
      "Show the property in its best light"
    ],
    goodImage: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop"
  },
  {
    id: 5,
    title: "Kitchen Photography",
    description: "Showcase clean, organized kitchens with professional presentation",
    tips: [
      "Clean all surfaces and appliances",
      "Organize countertops minimally",
      "Show appliances clearly",
      "Use good lighting to highlight features"
    ],
    goodImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&brightness=0.5"
  },
  {
    id: 6,
    title: "Bathroom Photography",
    description: "Present clean, organized bathrooms with closed toilet seats",
    tips: [
      "Always close the toilet seat",
      "Clean all surfaces thoroughly",
      "Organize items neatly",
      "Use good lighting for clarity"
    ],
    goodImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop&brightness=0.4"
  },
  {
    id: 7,
    title: "Bedroom Photography",
    description: "Showcase bedrooms with neatly made beds and organized spaces",
    tips: [
      "Make the bed neatly",
      "Remove clutter from surfaces",
      "Show the entire room",
      "Use natural light when possible"
    ],
    goodImage: "https://images.unsplash.com/photo-1540932239986-310128078ceb?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1540932239986-310128078ceb?w=800&h=600&fit=crop&brightness=0.3"
  },
  {
    id: 8,
    title: "Horizon Line",
    description: "Keep horizon lines level and straight in all exterior and landscape shots",
    tips: [
      "Use a level tool or grid in your camera",
      "Avoid tilted or crooked horizons",
      "Check alignment before taking the shot",
      "Correct in post-processing if needed"
    ],
    goodImage: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop&rotate=5"
  },
  {
    id: 9,
    title: "Focus & Sharpness",
    description: "Ensure all photos are sharp and in focus with excellent clarity",
    tips: [
      "Use appropriate aperture settings",
      "Focus on key features",
      "Avoid motion blur",
      "Check focus before taking the shot"
    ],
    goodImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&blur=5"
  },
  {
    id: 10,
    title: "Mirror & Reflection Handling",
    description: "Avoid photographer reflections in mirrors and reflective surfaces",
    tips: [
      "Position yourself out of frame",
      "Use a wide angle to minimize reflections",
      "Clean mirrors before shooting",
      "Angle the camera to avoid reflections"
    ],
    goodImage: "https://images.unsplash.com/photo-1565183938294-7563f3ce68c5?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop"
  },
  {
    id: 11,
    title: "Clutter Management",
    description: "Minimize visual clutter and distractions in all photos",
    tips: [
      "Remove personal items",
      "Organize furniture naturally",
      "Clear countertops",
      "Hide unnecessary items"
    ],
    goodImage: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop&brightness=0.6"
  },
  {
    id: 12,
    title: "Color Accuracy",
    description: "Ensure accurate color representation with proper white balance",
    tips: [
      "Set correct white balance for lighting conditions",
      "Avoid color casts",
      "Use a color checker card if needed",
      "Adjust in post-processing carefully"
    ],
    goodImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&hue=180"
  },
  {
    id: 13,
    title: "Exposure Control",
    description: "Properly expose photos without blown highlights or dark shadows",
    tips: [
      "Use exposure metering correctly",
      "Avoid overexposure in windows",
      "Maintain detail in shadows",
      "Use HDR when appropriate"
    ],
    goodImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&brightness=1.5"
  },
  {
    id: 14,
    title: "Vertical Alignment",
    description: "Keep vertical lines straight and avoid perspective distortion",
    tips: [
      "Align walls and door frames vertically",
      "Use a level or grid",
      "Avoid tilting the camera",
      "Correct in post-processing if needed"
    ],
    goodImage: "https://images.unsplash.com/photo-1565183938294-7563f3ce68c5?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop"
  },
  {
    id: 15,
    title: "Outdoor Landscaping",
    description: "Showcase property grounds and landscaping effectively",
    tips: [
      "Include landscaping and yard features",
      "Show property boundaries",
      "Capture seasonal appeal",
      "Avoid harsh shadows on grass"
    ],
    goodImage: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop&brightness=0.3"
  },
  {
    id: 16,
    title: "Staging & Presentation",
    description: "Present properties in their best condition with proper staging",
    tips: [
      "Coordinate with sellers on preparation",
      "Suggest minor improvements",
      "Remove personal photos and items",
      "Arrange furniture for flow"
    ],
    goodImage: "https://images.unsplash.com/photo-1540932239986-310128078ceb?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1540932239986-310128078ceb?w=800&h=600&fit=crop&brightness=0.4"
  },
  {
    id: 17,
    title: "Detail Shots",
    description: "Capture important details like fixtures, flooring, and architectural features",
    tips: [
      "Photograph key features",
      "Show hardware and finishes",
      "Include flooring details",
      "Highlight unique elements"
    ],
    goodImage: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop&brightness=0.2"
  },
  {
    id: 18,
    title: "Consistency",
    description: "Maintain consistent style and quality across all photos",
    tips: [
      "Use the same editing style",
      "Maintain consistent color grading",
      "Keep similar composition approach",
      "Match lighting quality"
    ],
    goodImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&hue=90"
  },
  {
    id: 19,
    title: "File Organization",
    description: "Organize and name files properly for easy delivery and management",
    tips: [
      "Use clear naming conventions",
      "Organize by room or location",
      "Include metadata in files",
      "Deliver in organized folders"
    ],
    goodImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&brightness=0.5"
  },
  {
    id: 20,
    title: "Delivery Standards",
    description: "Deliver photos within deadline with proper editing and optimization",
    tips: [
      "Meet delivery deadlines",
      "Edit photos professionally",
      "Optimize file sizes",
      "Provide in requested format"
    ],
    goodImage: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop",
    badImage: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop&brightness=0.2"
  }
];

export default function PhotographerGuidelines() {
  const [selectedGuideline, setSelectedGuideline] = useState<number>(1);
  const currentGuideline = guidelines.find(g => g.id === selectedGuideline) || guidelines[0];

  return (
    <PhotographerLayout>
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real Estate Photography Guidelines
          </h1>
          <p className="text-xl text-gray-600">
            Learn best practices for professional real estate photography
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Guidelines List */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guidelines</CardTitle>
                  <CardDescription>Select a guideline to view</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {guidelines.map((guideline) => (
                      <button
                        key={guideline.id}
                        onClick={() => setSelectedGuideline(guideline.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          selectedGuideline === guideline.id
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{guideline.id}. {guideline.title}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content - Guideline Details */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {currentGuideline.id}. {currentGuideline.title}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {currentGuideline.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Tips Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips:</h3>
                  <ul className="space-y-2">
                    {currentGuideline.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image Comparison */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Good vs. Bad Examples
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Good Example */}
                    <div>
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-3 h-64">
                        <img
                          src={currentGuideline.goodImage}
                          alt="Good example"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Good+Example';
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Good
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        This is the correct way to photograph this aspect
                      </p>
                    </div>

                    {/* Bad Example */}
                    <div>
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-3 h-64">
                        <img
                          src={currentGuideline.badImage}
                          alt="Bad example"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Avoid+This';
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Avoid
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        Avoid these common mistakes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={() => setSelectedGuideline(Math.max(1, selectedGuideline - 1))}
                    disabled={selectedGuideline === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-gray-600">
                    Guideline {selectedGuideline} of {guidelines.length}
                  </span>
                  <button
                    onClick={() => setSelectedGuideline(Math.min(guidelines.length, selectedGuideline + 1))}
                    disabled={selectedGuideline === guidelines.length}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </PhotographerLayout>
  );
}
