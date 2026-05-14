import { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  onProcess: (text: string, filename: string) => Promise<void>;
  processing: boolean;
}

const SAMPLE_FNOLS = [
  {
    name: 'FNOL-001-AutoCollision.txt',
    text: `FIRST NOTICE OF LOSS

Policy Number: AUTO-2024-78432
Policyholder Name: James R. Mitchell
Effective Dates: 01/01/2024 to 12/31/2024

INCIDENT INFORMATION
Date of Loss: 03/15/2024
Time of Incident: 02:34 PM
Location: I-95 Northbound, Exit 42, Hartford, CT 06103
Description of Accident: Insured vehicle was struck from behind by a silver SUV while stopped in traffic due to construction zone. The impact caused the rear bumper and trunk to crumple significantly. The other driver admitted fault at the scene.

INVOLVED PARTIES
Claimant: James R. Mitchell
Third Parties: Robert E. Sullivan (other driver)
Contact Details: (860) 555-0192

ASSET DETAILS
Asset Type: 2021 Toyota Camry SE
Asset ID: VIN 4T1B11HK5MU123456
Plate Number: CT XYZ-4521
Estimated Damage: $18,500

CLAIM INFORMATION
Claim Type: Auto Collision
Attachments: Police report #2024-0315-042, photos attached
Initial Estimate: $18,500`,
  },
  {
    name: 'FNOL-002-InjuryClaim.txt',
    text: `FIRST NOTICE OF LOSS

Policy Number: HOME-2023-55891
Policyholder Name: Sandra L. Nguyen
Effective Dates: 06/01/2023 to 05/31/2024

INCIDENT INFORMATION
Date of Loss: 04/02/2024
Time of Incident: 09:15 AM
Location: 1247 Maple Street, Austin, TX 78701
Description of Accident: Visitor slipped on icy walkway leading to front door of insured property. Visitor sustained a broken wrist and possible back injury. Ambulance was called and visitor was transported to St. David's Medical Center.

INVOLVED PARTIES
Claimant: Sandra L. Nguyen
Third Parties: Maria Chen (injured visitor)
Contact Details: (512) 555-0847

ASSET DETAILS
Asset Type: Residential Property
Asset ID: PROP-TX-2023-009812
Estimated Damage: $45,000

CLAIM INFORMATION
Claim Type: Personal Injury / Liability
Attachments: Incident report, medical bills
Initial Estimate: $45,000`,
  },
  {
    name: 'FNOL-003-FraudFlag.txt',
    text: `FIRST NOTICE OF LOSS

Policy Number: AUTO-2024-11204
Policyholder Name: Derek O. Harmon
Effective Dates: 02/01/2024 to 01/31/2025

INCIDENT INFORMATION
Date of Loss: 04/10/2024
Time of Incident: 11:45 PM
Location: Unknown parking lot, Chicago, IL
Description of Accident: The insured reports the vehicle was stolen overnight. However, witness accounts appear inconsistent with the insured's statement. Neighbor reports seeing insured drive away with the vehicle earlier that evening. The claim appears staged and the timeline seems fabricated based on surveillance footage review.

INVOLVED PARTIES
Claimant: Derek O. Harmon
Third Parties: None reported
Contact Details: (312) 555-0334

ASSET DETAILS
Asset Type: 2022 BMW 5-Series
Asset ID: VIN WBA13BJ00NCK12345
Estimated Damage: $62,000

CLAIM INFORMATION
Claim Type: Auto Theft
Attachments: Police report #2024-0410-991
Initial Estimate: $62,000`,
  },
  {
    name: 'FNOL-004-MissingFields.txt',
    text: `FIRST NOTICE OF LOSS

Policyholder Name: Patricia W. Evans

INCIDENT INFORMATION
Location: Miami, FL 33101
Description of Accident: Water damage to property caused by burst pipe in upstairs bathroom. Damage extends to ceiling, flooring, and walls in two rooms.

INVOLVED PARTIES
Contact Details: (305) 555-0721

ASSET DETAILS
Asset Type: Residential Property
Estimated Damage: $12,800

CLAIM INFORMATION
Claim Type: Property Damage - Water
Attachments: Plumber assessment, photos`,
  },
];

export function UploadPanel({ onProcess, processing }: Props) {
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError('');
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setText((e.target?.result as string) ?? '');
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Please upload a document or paste FNOL text.'); return; }
    setError('');
    await onProcess(text, filename || 'pasted-document.txt');
    setText('');
    setFilename('');
  };

  const loadSample = (sample: typeof SAMPLE_FNOLS[0]) => {
    setText(sample.text);
    setFilename(sample.name);
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
        <Upload size={32} className={`mx-auto mb-3 ${dragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700 mb-1">Drop FNOL document here or click to browse</p>
        <p className="text-xs text-gray-400">Supports TXT, PDF, DOC formats</p>
      </div>

      {/* Filename indicator */}
      {filename && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <FileText size={14} className="text-blue-500 shrink-0" />
          <span className="text-xs text-blue-700 font-medium truncate flex-1">{filename}</span>
          <button onClick={() => { setFilename(''); setText(''); }} className="text-blue-400 hover:text-blue-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400">or paste text</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setFilename(''); }}
        placeholder="Paste FNOL document text here..."
        rows={8}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Process button */}
      <button
        onClick={handleSubmit}
        disabled={processing || !text.trim()}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing Claim...
          </>
        ) : (
          'Process FNOL Claim'
        )}
      </button>

      {/* Sample documents */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sample Documents</p>
        <div className="space-y-2">
          {SAMPLE_FNOLS.map((sample) => (
            <button
              key={sample.name}
              onClick={() => loadSample(sample)}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 group"
            >
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-gray-400 group-hover:text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">{sample.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
