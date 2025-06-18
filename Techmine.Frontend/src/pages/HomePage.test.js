import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import HomePage from './HomePage';
import { supabase } from '../services/supabaseClient';

// Mock Supabase client
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  },
}));

// Mock Link component from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
}));


describe('HomePage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    supabase.from.mockClear();
    supabase.select.mockClear();
    supabase.eq.mockClear();
    supabase.gte.mockClear();
    supabase.order.mockClear();
    supabase.limit.mockClear();
  });

  test('renders dashboard with summary data and quick links', async () => {
    // Mock data for summaries
    const mockReportCount = { count: 5, error: null };
    const mockIncidentCount = { count: 3, error: null };
    const mockWorksiteCount = { count: 10, error: null };

    // Mock data for activity feed
    const mockRecentReports = {
      data: [{ id: 'r1', title: 'Report 1', created_at: new Date().toISOString() }],
      error: null
    };
    const mockRecentIncidents = {
      data: [{ id: 'i1', title: 'Incident 1', created_at: new Date().toISOString(), status: 'Open' }],
      error: null
    };

    // Setup mock implementations
    supabase.from.mockImplementation((tableName) => {
      if (tableName === 'reports') {
        // For report count
        supabase.gte.mockResolvedValueOnce(mockReportCount);
        // For recent reports
        supabase.order.mockReturnThis();
        supabase.limit.mockResolvedValueOnce(mockRecentReports);
      } else if (tableName === 'incidents') {
        // For incident count
        supabase.eq.mockResolvedValueOnce(mockIncidentCount);
        // For recent incidents
        supabase.order.mockReturnThis();
        supabase.limit.mockResolvedValueOnce(mockRecentIncidents);
      } else if (tableName === 'worksites') {
        // For worksite count
        supabase.eq.mockResolvedValueOnce(mockWorksiteCount);
      }
      return supabase; // Return 'this' for chaining
    });

    // For the initial calls in useEffect that don't chain further after gte/eq for counts
    supabase.select.mockImplementation((columns, options) => {
        if (options && options.count === 'exact') {
            // This path is taken by count queries
            // We need to make sure the specific mock (gte/eq) is set up correctly before this
        } else {
            // This path is for data selection (recent activities)
        }
        return supabase; // Return 'this' for chaining
    });


    render(
      <Router>
        <HomePage />
      </Router>
    );

    // Check for loading message initially
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();

    // Wait for data to load and check for summary cards
    await waitFor(() => {
      expect(screen.getByText('Recent Reports (Last 7 Days)')).toBeInTheDocument();
      expect(screen.getByText(mockReportCount.count.toString())).toBeInTheDocument();
    });
    expect(screen.getByText('Open Incidents')).toBeInTheDocument();
    expect(screen.getByText(mockIncidentCount.count.toString())).toBeInTheDocument();
    expect(screen.getByText('Active Worksites')).toBeInTheDocument();
    expect(screen.getByText(mockWorksiteCount.count.toString())).toBeInTheDocument();

    // Check for quick access links
    expect(screen.getByRole('link', { name: /create new report/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create new attachment/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /report an incident/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view all reports/i })).toBeInTheDocument();

    // Check for activity feed items
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.getByText((content, element) => element.tagName.toLowerCase() === 'span' && content.includes('Report 1'))).toBeInTheDocument();
        expect(screen.getByText((content, element) => element.tagName.toLowerCase() === 'span' && content.includes('Incident 1'))).toBeInTheDocument();
    });
  });

  test('displays error message if fetching data fails', async () => {
    supabase.from.mockImplementation(() => {
      // Simulate an error for one of the calls, e.g., reports count
      supabase.gte.mockRejectedValueOnce(new Error('Failed to fetch reports'));
      // Mock other calls to resolve to prevent further errors masking the tested one
      supabase.eq.mockResolvedValue({ count: 0, error: null });
      supabase.order.mockReturnThis();
      supabase.limit.mockResolvedValue({ data: [], error: null });
      return supabase;
    });
     supabase.select.mockReturnValue(supabase); // Ensure select is also part of the mock chain

    render(
      <Router>
        <HomePage />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText(/error: failed to fetch reports/i)).toBeInTheDocument();
    });
  });
});
